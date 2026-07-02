from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import SessionLocal
from app.core.config_qr import QR_MINUTOS_ANTES, QR_MINUTOS_DESPUES

router = APIRouter(prefix="/qr", tags=["qr"])

TZ_ARG = ZoneInfo("America/Argentina/Buenos_Aires")

# Mensaje único para "no tenés clase ahora", usado tanto para QR de abono
# como para QR de reserva suelta.
MENSAJE_FUERA_DE_VENTANA = (
    f"No tenés clase en este horario "
    #f"(ventana: {QR_MINUTOS_ANTES} min antes, {QR_MINUTOS_DESPUES} min después)."
)


# ── Configuración ─────────────────────────────────────────────────────────────
# Modificar estos valores en app/core/config_qr.py
# QR_MINUTOS_ANTES   = 60  → ventana antes del inicio de clase
# QR_MINUTOS_DESPUES = 15  → ventana después del inicio de clase


# ── DB ────────────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ───────────────────────────────────────────────────────────────────

class EscaneoRequest(BaseModel):
    qr_token: str
    secretario_id: int


# ── Helpers compartidos ────────────────────────────────────────────────────────

def _verificar_secretario(secretario_id: int, db: Session) -> None:
    secretario = db.execute(
        text("SELECT id, rol FROM usuarios WHERE id = :id"),
        {"id": secretario_id},
    ).fetchone()

    if not secretario or secretario.rol != "secretario":
        raise HTTPException(status_code=403, detail="Sin permisos para registrar asistencia.")


def _dentro_de_ventana(hora_clase, hora_actual) -> bool:
    """
    True si hora_actual cae dentro de [hora_clase - QR_MINUTOS_ANTES, hora_clase + QR_MINUTOS_DESPUES].
    Se calcula en Python (en vez de una query extra a Postgres) cuando ya tenemos
    la hora de la clase disponible de una consulta anterior.
    """
    base = datetime.combine(date.today(), hora_clase)
    inicio = (base - timedelta(minutes=QR_MINUTOS_ANTES)).time()
    fin = (base + timedelta(minutes=QR_MINUTOS_DESPUES)).time()
    return inicio <= hora_actual <= fin


def _registrar_asistencia(reserva_id: int, nombre: str, apellido: str, fecha, hora, db: Session) -> dict:
    db.execute(
        text("""
            UPDATE reservas
            SET estado = 'asistio'::estado_reserva
            WHERE id = :reserva_id
        """),
        {"reserva_id": reserva_id},
    )
    db.commit()

    return {
        "ok": True,
        "mensaje": f"Asistencia registrada para {nombre} {apellido}.",
        "clase": {"fecha": str(fecha), "hora": str(hora)[:5]},
    }


# ── Endpoints de obtención de QR (sin cambios de lógica) ──────────────────────

@router.get("/abono/{abono_id}")
def get_qr_abono(abono_id: int, usuario_id: int, db: Session = Depends(get_db)):
    """
    Devuelve el qr_token del abono si pertenece al usuario y está activo.
    El frontend usa este token para generar la imagen del QR.
    """
    abono = db.execute(
        text("""
            SELECT id, qr_token, estado, activo, fecha_fin
            FROM abonos
            WHERE id = :abono_id AND usuario_id = :usuario_id
        """),
        {"abono_id": abono_id, "usuario_id": usuario_id},
    ).fetchone()

    if not abono:
        raise HTTPException(status_code=400, detail="Abono no encontrado.")

    if not abono.activo or abono.estado != "activo":
        raise HTTPException(status_code=400, detail="El abono no está activo.")

    if abono.fecha_fin and abono.fecha_fin < date.today():
        raise HTTPException(status_code=400, detail="El abono está vencido.")

    if not abono.qr_token:
        raise HTTPException(status_code=500, detail="El abono no tiene QR generado.")

    return {"qr_token": abono.qr_token}


@router.get("/reserva/{reserva_id}")
def get_qr_reserva(reserva_id: int, usuario_id: int, db: Session = Depends(get_db)):
    """
    Devuelve el qr_token de una reserva suelta si pertenece al usuario
    y está confirmada.
    """
    reserva = db.execute(
        text("""
            SELECT r.id, r.qr_token, r.estado, r.usuario_id
            FROM reservas r
            WHERE r.id = :reserva_id
              AND r.usuario_id = :usuario_id
        """),
        {"reserva_id": reserva_id, "usuario_id": usuario_id},
    ).fetchone()

    if not reserva:
        raise HTTPException(status_code=400, detail="Reserva no encontrada.")

    if reserva.estado not in ("confirmada", "pendiente"):
        raise HTTPException(status_code=400, detail="La reserva no está activa.")

    if not reserva.qr_token:
        raise HTTPException(status_code=500, detail="La reserva no tiene QR generado.")

    return {"qr_token": reserva.qr_token}


# ── Endpoint único de escaneo ──────────────────────────────────────────────────

@router.post("/escanear")
def escanear_qr(data: EscaneoRequest, db: Session = Depends(get_db)):
    """
    Registra asistencia escaneando CUALQUIER QR (de abono o de reserva suelta).

    Un solo endpoint para las dos historias de usuario: detecta de qué tipo
    es el token consultando primero `abonos` y después `reservas`, y ambos
    caminos terminan en el mismo chequeo de ventana horaria
    (MENSAJE_FUERA_DE_VENTANA) y el mismo registro de asistencia
    (_registrar_asistencia).
    """
    _verificar_secretario(data.secretario_id, db)

    ahora = datetime.now(TZ_ARG)
    hoy = ahora.date()
    hora_actual = ahora.time()

    # ── ¿El token es de un abono? ─────────────────────────────────────────────
    abono = db.execute(
        text("""
            SELECT a.id, a.estado, a.activo, a.fecha_fin, u.nombre, u.apellido
            FROM abonos a
            JOIN usuarios u ON u.id = a.usuario_id
            WHERE a.qr_token = :token
        """),
        {"token": data.qr_token},
    ).fetchone()

    if abono:
        return _escanear_abono(abono, hoy, hora_actual, db)

    # ── ¿El token es de una reserva suelta? ───────────────────────────────────
    reserva = db.execute(
        text("""
            SELECT r.id, r.estado, u.nombre, u.apellido,
                   cp.fecha, cp.hora, cp.activo AS clase_activa
            FROM reservas r
            JOIN usuarios u            ON u.id  = r.usuario_id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE r.qr_token = :token
        """),
        {"token": data.qr_token},
    ).fetchone()

    if reserva:
        return _escanear_reserva(reserva, hoy, hora_actual, db)

    raise HTTPException(status_code=400, detail="QR inválido.")


def _escanear_abono(abono, hoy, hora_actual, db: Session) -> dict:
    # ── Validar que el abono está activo ──────────────────────────────────────
    if not abono.activo or abono.estado != "activo":
        raise HTTPException(status_code=400, detail="El abono no está activo.")

    if abono.fecha_fin and abono.fecha_fin < date.today():
        raise HTTPException(status_code=400, detail="El abono está vencido.")

    # ── Presente si HAY una reserva confirmada para este horario ──────────────
    # (un solo query: reemplaza el viejo par "buscar clase en la zona" +
    # "buscar reserva confirmada para esa clase")
    reserva = db.execute(
        text("""
            SELECT r.id, r.estado, u.nombre, u.apellido, cp.fecha, cp.hora, cp.activo AS clase_activa
            FROM reservas r
            JOIN abono_reservas ar      ON ar.reserva_id = r.id
            JOIN clases_programadas cp  ON cp.id = r.clase_programada_id
            JOIN usuarios u            ON u.id = r.usuario_id
            WHERE ar.abono_id = :abono_id
              AND cp.activo   = true
              AND cp.fecha    = :hoy
              AND CAST(:hora_actual AS TIME) BETWEEN
                  (cp.hora - :minutos_antes  * INTERVAL '1 minute') AND
                  (cp.hora + :minutos_despues * INTERVAL '1 minute')
            LIMIT 1
        """),
        {
            "abono_id": abono.id,
            "hoy": hoy,
            "hora_actual": hora_actual,
            "minutos_antes": QR_MINUTOS_ANTES,
            "minutos_despues": QR_MINUTOS_DESPUES,
        },
    ).fetchone()

    if not reserva:
        raise HTTPException(status_code=400, detail=MENSAJE_FUERA_DE_VENTANA)

    return _escanear_reserva(
        reserva,
        hoy,
        hora_actual,
        db,
    )

def _escanear_reserva(reserva, hoy, hora_actual, db: Session) -> dict:
    # ── Validar estado de la reserva ──────────────────────────────────────────
    if reserva.estado == "asistio":
        raise HTTPException(
            status_code=400,
            detail=f"{reserva.nombre} {reserva.apellido} ya registró asistencia para esta clase.",
        )

    if reserva.estado == "cancelada":
        raise HTTPException(status_code=400, detail="La reserva está cancelada.")

    if reserva.estado == "ausente":
        raise HTTPException(status_code=400, detail="La reserva fue marcada como ausente.")

    # ── Validar ventana horaria sin query extra: ya tenemos fecha/hora
    # de la clase desde el SELECT inicial en escanear_qr ──────────────────────
    if (
        not reserva.clase_activa
        or reserva.fecha != hoy
        or not _dentro_de_ventana(reserva.hora, hora_actual)
    ):
        raise HTTPException(status_code=400, detail=MENSAJE_FUERA_DE_VENTANA)

    return _registrar_asistencia(reserva.id, reserva.nombre, reserva.apellido, reserva.fecha, reserva.hora, db)