from datetime import date, datetime, time
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import SessionLocal
from app.core.config_qr import QR_MINUTOS_ANTES, QR_MINUTOS_DESPUES

router = APIRouter(prefix="/qr", tags=["qr"])

TZ_ARG = ZoneInfo("America/Argentina/Buenos_Aires")


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


# ── Endpoints ─────────────────────────────────────────────────────────────────

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
        raise HTTPException(status_code=404, detail="Abono no encontrado.")

    if not abono.activo or abono.estado != "activo":
        raise HTTPException(status_code=400, detail="El abono no está activo.")

    if abono.fecha_fin and abono.fecha_fin < date.today():
        raise HTTPException(status_code=400, detail="El abono está vencido.")

    if not abono.qr_token:
        raise HTTPException(status_code=500, detail="El abono no tiene QR generado.")

    return {"qr_token": abono.qr_token}


@router.post("/escanear")
def escanear_qr(data: EscaneoRequest, db: Session = Depends(get_db)):
    """
    Registra la asistencia de un alumno escaneando el QR de su abono.
    Validaciones: secretario, abono activo, clase próxima, reserva confirmada,
    ventana horaria y que no haya asistido ya esta semana.
    """

    # ── 1. Verificar que quien escanea es secretario ──────────────────────────
    secretario = db.execute(
        text("SELECT id, rol FROM usuarios WHERE id = :id"),
        {"id": data.secretario_id},
    ).fetchone()

    if not secretario or secretario.rol != "secretario":
        raise HTTPException(status_code=403, detail="Sin permisos para registrar asistencia.")

    # ── 2. Buscar el abono por qr_token ───────────────────────────────────────
    abono = db.execute(
        text("""
            SELECT a.id, a.usuario_id, a.zona_id, a.estado, a.activo, a.fecha_fin,
                   u.nombre, u.apellido
            FROM abonos a
            JOIN usuarios u ON u.id = a.usuario_id
            WHERE a.qr_token = :token
        """),
        {"token": data.qr_token},
    ).fetchone()

    if not abono:
        raise HTTPException(status_code=404, detail="QR inválido.")

    # ── 3. Verificar que el abono está activo ─────────────────────────────────
    if not abono.activo or abono.estado != "activo":
        raise HTTPException(status_code=400, detail="El abono no está activo.")

    if abono.fecha_fin and abono.fecha_fin < date.today():
        raise HTTPException(status_code=400, detail="El abono está vencido.")

    # ── 4. Buscar clase próxima dentro de la ventana horaria ──────────────────
    ahora = datetime.now(TZ_ARG)
    hoy = ahora.date()
    hora_actual = ahora.time()

    clase = db.execute(
        text("""
            SELECT cp.id, cp.fecha, cp.hora
            FROM clases_programadas cp
            WHERE cp.zona_id = :zona_id
            AND cp.activo  = true
            AND cp.fecha   = :hoy
            AND CAST(:hora_actual AS TIME) BETWEEN
                (cp.hora - :minutos_antes  * INTERVAL '1 minute') AND
                (cp.hora + :minutos_despues * INTERVAL '1 minute')
            ORDER BY cp.hora
            LIMIT 1
        """),
        {
            "zona_id": abono.zona_id,
            "hoy": hoy,
            "hora_actual": hora_actual,
            "minutos_antes": QR_MINUTOS_ANTES,
            "minutos_despues": QR_MINUTOS_DESPUES,
        },
    ).fetchone()

    if not clase:
        raise HTTPException(
            status_code=400,
            detail=f"No hay clase en los próximos {QR_MINUTOS_ANTES} minutos para este abono.",
        )

    # ── 5. Verificar reserva confirmada para esa clase ────────────────────────
    reserva = db.execute(
        text("""
            SELECT r.id, r.estado
            FROM reservas r
            JOIN abono_reservas ar ON ar.reserva_id = r.id
            WHERE ar.abono_id          = :abono_id
              AND r.clase_programada_id = :clase_id
              AND r.estado             = 'confirmada'::estado_reserva
        """),
        {"abono_id": abono.id, "clase_id": clase.id},
    ).fetchone()

    if not reserva:
        raise HTTPException(
            status_code=400,
            detail="No hay una reserva confirmada para esta clase.",
        )

    # ── 6. Verificar que no asistió ya esta semana ────────────────────────────
    asistio_semana = db.execute(
        text("""
            SELECT r.id
            FROM reservas r
            JOIN abono_reservas ar ON ar.reserva_id = r.id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE ar.abono_id  = :abono_id
              AND r.estado     = 'asistio'::estado_reserva
              AND EXTRACT(WEEK FROM cp.fecha)  = EXTRACT(WEEK FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM cp.fecha)  = EXTRACT(YEAR FROM CURRENT_DATE)
        """),
        {"abono_id": abono.id},
    ).fetchone()

    if asistio_semana:
        raise HTTPException(
            status_code=400,
            detail=f"{abono.nombre} {abono.apellido} ya registró asistencia esta semana.",
        )

    # ── 7. Registrar asistencia ───────────────────────────────────────────────
    db.execute(
        text("""
            UPDATE reservas
            SET estado = 'asistio'::estado_reserva
            WHERE id = :reserva_id
        """),
        {"reserva_id": reserva.id},
    )
    db.commit()

    return {
        "ok": True,
        "mensaje": f"Asistencia registrada para {abono.nombre} {abono.apellido}.",
        "clase": {
            "fecha": str(clase.fecha),
            "hora": str(clase.hora)[:5],
        },
    }


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
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    if reserva.estado not in ("confirmada", "pendiente"):
        raise HTTPException(status_code=400, detail="La reserva no está activa.")

    if not reserva.qr_token:
        raise HTTPException(status_code=500, detail="La reserva no tiene QR generado.")

    return {"qr_token": reserva.qr_token}


@router.post("/escanear-reserva")
def escanear_qr_reserva(data: EscaneoRequest, db: Session = Depends(get_db)):
    """
    Registra asistencia escaneando el QR de una reserva suelta.
    Sin límite semanal, pero respeta la ventana horaria.
    """

    # ── 1. Verificar secretario ───────────────────────────────────────────────
    secretario = db.execute(
        text("SELECT id, rol FROM usuarios WHERE id = :id"),
        {"id": data.secretario_id},
    ).fetchone()

    if not secretario or secretario.rol != "secretario":
        raise HTTPException(status_code=403, detail="Sin permisos para registrar asistencia.")

    # ── 2. Buscar la reserva por qr_token ─────────────────────────────────────
    reserva = db.execute(
        text("""
            SELECT r.id, r.estado, r.clase_programada_id,
                   u.nombre, u.apellido,
                   cp.fecha, cp.hora, cp.zona_id
            FROM reservas r
            JOIN usuarios u             ON u.id  = r.usuario_id
            JOIN clases_programadas cp  ON cp.id = r.clase_programada_id
            WHERE r.qr_token = :token
        """),
        {"token": data.qr_token},
    ).fetchone()

    if not reserva:
        raise HTTPException(status_code=404, detail="QR inválido.")

    # ── 3. Verificar estado de la reserva ─────────────────────────────────────
    if reserva.estado == "asistio":
        raise HTTPException(
            status_code=400,
            detail=f"{reserva.nombre} {reserva.apellido} ya registró asistencia para esta clase.",
        )

    if reserva.estado == "cancelada":
        raise HTTPException(status_code=400, detail="La reserva está cancelada.")

    if reserva.estado == "ausente":
        raise HTTPException(status_code=400, detail="La reserva fue marcada como ausente.")

    # ── 4. Verificar ventana horaria ──────────────────────────────────────────
    ahora = datetime.now(TZ_ARG)
    hoy = ahora.date()
    hora_actual = ahora.time()

    clase = db.execute(
        text("""
            SELECT cp.fecha, cp.hora
            FROM clases_programadas cp
            WHERE cp.id     = :clase_id
            AND cp.activo = true
            AND cp.fecha  = :hoy
            AND CAST(:hora_actual AS TIME) BETWEEN
                (cp.hora - :minutos_antes  * INTERVAL '1 minute') AND
                (cp.hora + :minutos_despues * INTERVAL '1 minute')
        """),
        {
            "clase_id": reserva.clase_programada_id,
            "hoy": hoy,
            "hora_actual": hora_actual,
            "minutos_antes": QR_MINUTOS_ANTES,
            "minutos_despues": QR_MINUTOS_DESPUES,
        },
    ).fetchone()

    if not clase:
        raise HTTPException(
            status_code=400,
            detail=f"La clase no está dentro de la ventana de escaneo ({QR_MINUTOS_ANTES} min antes, {QR_MINUTOS_DESPUES} min después).",
        )

    # ── 5. Registrar asistencia ───────────────────────────────────────────────
    db.execute(
        text("""
            UPDATE reservas
            SET estado = 'asistio'::estado_reserva
            WHERE id = :reserva_id
        """),
        {"reserva_id": reserva.id},
    )
    db.commit()

    return {
        "ok": True,
        "mensaje": f"Asistencia registrada para {reserva.nombre} {reserva.apellido}.",
        "clase": {
            "fecha": str(reserva.fecha),
            "hora": str(reserva.hora)[:5],
        },
    }