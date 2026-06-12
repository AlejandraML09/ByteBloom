from datetime import date as date_type
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import text


from app.database import SessionLocal

router = APIRouter(prefix="/abonos", tags=["abonos"])

_MEDIO_PAGO_MAP = {
    "efectivo": "Efectivo",
    "transferencia": "Transferencia",
    "mercado_pago": "Mercado Pago",
    "mercadopago": "Mercado Pago",
}




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/mis-abonos")
def get_mis_abonos(usuario_id: int, db: Session = Depends(get_db)):
    """Devuelve todos los abonos del usuario con sus pagos y reservas asociadas."""
    abonos = db.execute(
        text("""
            SELECT a.id, a.zona_id, z.nombre AS zona_nombre,
                   a.fecha_inicio, a.fecha_fin, a.monto_mensual,
                   a.dia_limite_pago, a.estado::text AS estado, a.activo
            FROM abonos a
            JOIN zonas z ON z.id = a.zona_id
            WHERE a.usuario_id = :usuario_id
            ORDER BY a.fecha_inicio DESC
        """),
        {"usuario_id": usuario_id},
    ).fetchall()

    result = []
    for abono in abonos:
        pagos = db.execute(
            text("""
                SELECT p.id, p.anio, p.mes, p.fecha_vencimiento,
                       p.fecha_pago, p.monto, p.estado::text AS estado,
                       mp.nombre AS medio_pago
                FROM pagos_abono p
                LEFT JOIN medios_pago mp ON mp.id = p.medio_pago_id
                WHERE p.abono_id = :abono_id
                ORDER BY p.anio DESC, p.mes DESC
            """),
            {"abono_id": abono.id},
        ).fetchall()

        reservas = db.execute(
            text("""
                SELECT r.id AS reserva_id,
                       cp.id AS clase_programada_id,
                       cp.fecha,
                       cp.hora,
                       r.estado::text AS estado
                FROM abono_reservas ar
                JOIN reservas r          ON r.id  = ar.reserva_id
                JOIN clases_programadas cp ON cp.id = r.clase_programada_id
                WHERE ar.abono_id = :abono_id
                ORDER BY cp.fecha, cp.hora
            """),
            {"abono_id": abono.id},
        ).fetchall()

        result.append(
            {
                "id": abono.id,
                "zona_id": abono.zona_id,
                "zona": abono.zona_nombre,
                "fecha_inicio": str(abono.fecha_inicio),
                "fecha_fin": str(abono.fecha_fin) if abono.fecha_fin else None,
                "monto_mensual": float(abono.monto_mensual),
                "dia_limite_pago": abono.dia_limite_pago,
                "estado": abono.estado,
                "activo": abono.activo,
                "pagos": [
                    {
                        "id": p.id,
                        "anio": p.anio,
                        "mes": p.mes,
                        "fecha_vencimiento": str(p.fecha_vencimiento),
                        "fecha_pago": (
                            p.fecha_pago.isoformat() if p.fecha_pago else None
                        ),
                        "monto": float(p.monto),
                        "estado": p.estado,
                        "medio_pago": p.medio_pago,
                    }
                    for p in pagos
                ],
                "reservas": [
                    {
                        "reserva_id": r.reserva_id,
                        "clase_programada_id": r.clase_programada_id,
                        "fecha": str(r.fecha),
                        "hora": str(r.hora)[:5],
                        "estado": r.estado,
                    }
                    for r in reservas
                ],
            }
        )

    return result


class TurnoItemAbono(BaseModel):
    fecha: str
    hora: str


class SolicitudAbonoRequest(BaseModel):
    usuario_id: int
    zona_id: int
    turnos: List[TurnoItemAbono]
    medio_pago: str


@router.post("/solicitar")
def solicitar_abono(data: SolicitudAbonoRequest, db: Session = Depends(get_db)):
    """Crea un abono para el usuario en la zona indicada y reserva las sesiones seleccionadas."""

    # Validar que cada turno pertenece a una semana distinta y no contiene fechas/hora duplicadas
    semanas = []
    turnos_seleccionados = set()
    for item in data.turnos:
        key = (item.fecha, item.hora)
        if key in turnos_seleccionados:
            raise HTTPException(
                status_code=400,
                detail=f"No podés seleccionar dos veces el mismo turno ({item.fecha} a las {item.hora}).",
            )
        turnos_seleccionados.add(key)

        fecha_obj = date_type.fromisoformat(item.fecha)
        semana = fecha_obj.isocalendar()[:2]  # (year, week)
        if semana in semanas:
            raise HTTPException(
                status_code=400,
                detail=f"Dos sesiones caen en la misma semana ({item.fecha}). Cada sesión debe ser de una semana distinta.",
            )
        semanas.append(semana)

    zona = db.execute(
        text("SELECT id, precio FROM zonas WHERE id = :id"),
        {"id": data.zona_id},
    ).fetchone()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    db_medio = _MEDIO_PAGO_MAP.get(data.medio_pago.lower(), data.medio_pago)
    medio_pago = db.execute(
        text("SELECT id FROM medios_pago WHERE nombre = :nombre AND activo = true"),
        {"nombre": db_medio},
    ).fetchone()
    if not medio_pago:
        raise HTTPException(
            status_code=400,
            detail=f"Medio de pago '{data.medio_pago}' no disponible.",
        )

    existing = db.execute(
        text("SELECT id FROM abonos WHERE usuario_id = :uid AND zona_id = :zid AND activo = true"),
        {"uid": data.usuario_id, "zid": data.zona_id},
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tenés un abono activo para esta zona.")

    # Validar todos los slots antes de escribir nada
    clase_programadas = []
    for item in data.turnos:
        cp = db.execute(
            text("""
                SELECT cp.id, cp.cupo_disponible
                FROM clases_programadas cp
                WHERE cp.fecha = :fecha
                  AND cp.hora = :hora
                  AND cp.zona_id = :zona_id
                  AND cp.activo = true
            """),
            {"fecha": item.fecha, "hora": item.hora, "zona_id": data.zona_id},
        ).fetchone()
        if not cp:
            raise HTTPException(
                status_code=404,
                detail=f"No hay clase disponible para {item.fecha} a las {item.hora}.",
            )
        if cp.cupo_disponible <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Sin cupos para {item.fecha} a las {item.hora}.",
            )

        dup_reserva = db.execute(
            text("SELECT id FROM reservas WHERE usuario_id = :uid AND clase_programada_id = :cpid AND estado NOT IN ('cancelada'::estado_reserva)"),
            {"uid": data.usuario_id, "cpid": cp.id},
        ).fetchone()
        if dup_reserva:
            raise HTTPException(
                status_code=400,
                detail=f"Ya tenés una reserva para {item.fecha} a las {item.hora}.",
            )

        clase_programadas.append(cp)

    cantidad = len(clase_programadas)
    monto_mensual = float(zona.precio) * cantidad


    try:
        today = date_type.today()

        abono_row = db.execute(
            text("""
                INSERT INTO abonos
                    (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo, qr_token)
                VALUES (:uid, :zid, :fi, :mm, 10, 'activo', true, gen_random_uuid()::text)
                RETURNING id
            """),
            {
                "uid": data.usuario_id,
                "zid": data.zona_id,
                "fi": today,
                "mm": monto_mensual,
            },
        ).fetchone()
        abono_id = abono_row.id
        estado = "confirmada"
        if (db_medio == "Efectivo"):
            estado = "pendiente"
        for cp in clase_programadas:
            reserva_row = db.execute(
                text("""
                    INSERT INTO reservas
                        (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, pack_id, estado)
                    VALUES (:uid, :cpid, :mpid, :precio, :monto_total, :pack_id, :estado)
                    RETURNING id
                """),
                {
                    "uid": data.usuario_id,
                    "cpid": cp.id,
                    "mpid": medio_pago.id,
                    "precio": float(zona.precio),
                    "monto_total": float(zona.precio),
                    "pack_id": None,
                    "estado": estado,
                },
            ).fetchone()

            db.execute(
                text("""
                    INSERT INTO abono_reservas (abono_id, reserva_id)
                    VALUES (:abono_id, :reserva_id)
                """),
                {"abono_id": abono_id, "reserva_id": reserva_row.id},
            )

            db.execute(
                text(
                    "UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1 WHERE id = :id"
                ),
                {"id": cp.id},
            )

        # Pago del mes actual o siguiente según día límite
        dia_limite = 10
        if today.day > dia_limite:
            pago_mes = today.month % 12 + 1
            pago_anio = today.year if today.month < 12 else today.year + 1
        else:
            pago_mes = today.month
            pago_anio = today.year
        fecha_venc = date_type(pago_anio, pago_mes, dia_limite)

        db.execute(
            text("""
                INSERT INTO pagos_abono
                    (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
                VALUES (:aid, :mpid, :anio, :mes, :fv, :monto, 'pendiente')
            """),
            {
                "aid": abono_id,
                "mpid": medio_pago.id,
                "anio": pago_anio,
                "mes": pago_mes,
                "fv": fecha_venc,
                "monto": monto_mensual,
            },
        )

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        constraint = None
        if hasattr(exc.orig, 'diag'):
            constraint = getattr(exc.orig.diag, 'constraint_name', None)

        if constraint in {'uq_usuario_zona', 'uq_abonos_usuario_zona_activo'}:
            detail = 'Ya tenés un abono activo para esta zona.'
        elif constraint == 'uq_usuario_clase':
            detail = 'Ya tenés una reserva para uno de los horarios seleccionados.'
        else:
            detail = 'No se pudo crear el abono. Podría haber una reserva duplicada o un abono previo para esa zona.'

        raise HTTPException(status_code=400, detail=detail)

    return {"ok": True, "abono_id": abono_id}


# ── Helpers ────────────────────────────────────────────────────────────────────


def _target_month():
    """Devuelve (year, month) del período de inscripción activo."""
    today = date_type.today()
    if today.day <= 10:
        return today.year, today.month
    if today.month == 12:
        return today.year + 1, 1
    return today.year, today.month + 1


def _get_efectivo_id(db):
    mp = db.execute(
        text("SELECT id FROM medios_pago WHERE nombre = 'Efectivo' LIMIT 1")
    ).fetchone()
    if not mp:
        raise HTTPException(
            status_code=500, detail="Medio de pago 'Efectivo' no encontrado."
        )
    return mp.id


# ── GET /abonos/{abono_id}/sesiones ───────────────────────────────────────────


@router.get("/{abono_id}/sesiones")
def get_sesiones_abono(abono_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las reservas asociadas a este abono vía abono_reservas."""
    abono = db.execute(
        text("SELECT id, usuario_id, zona_id FROM abonos WHERE id = :id"),
        {"id": abono_id},
    ).fetchone()
    if not abono:
        raise HTTPException(status_code=404, detail="Abono no encontrado.")

    rows = db.execute(
        text("""
            SELECT r.id AS reserva_id,
                   cp.id AS clase_programada_id,
                   cp.fecha,
                   cp.hora,
                   r.estado::text AS estado
            FROM abono_reservas ar
            JOIN reservas r            ON r.id  = ar.reserva_id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE ar.abono_id = :abono_id
            ORDER BY cp.fecha, cp.hora
        """),
        {"abono_id": abono_id},
    ).fetchall()

    return [
        {
            "reserva_id": r.reserva_id,
            "clase_programada_id": r.clase_programada_id,
            "fecha": str(r.fecha),
            "hora": str(r.hora)[:5],
            "estado": r.estado,
        }
        for r in rows
    ]


# ── POST /abonos/{abono_id}/renovar ───────────────────────────────────────────


@router.post("/{abono_id}/renovar")
def renovar_abono(
    abono_id: int, medio_pago: str = "Efectivo", db: Session = Depends(get_db)
):
    """
    Crea 4 reservas en el mes objetivo replicando los días/horarios del abono
    anterior y las vincula en abono_reservas.
    """
    abono = db.execute(
        text(
            "SELECT id, usuario_id, zona_id, monto_mensual, dia_limite_pago FROM abonos WHERE id = :id AND activo = true"
        ),
        {"id": abono_id},
    ).fetchone()
    if not abono:
        raise HTTPException(status_code=404, detail="Abono no encontrado o inactivo.")

    # Validar que no tenga ya reservas del abono en el mes destino
    target_year, target_month = _target_month()

    existing = db.execute(
        text("""
            SELECT COUNT(*) AS cnt
            FROM abono_reservas ar
            JOIN reservas r            ON r.id  = ar.reserva_id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE ar.abono_id = :abono_id
              AND EXTRACT(YEAR  FROM cp.fecha)::int = :yr
              AND EXTRACT(MONTH FROM cp.fecha)::int = :mo
              AND r.estado NOT IN ('cancelada'::estado_reserva)
        """),
        {"abono_id": abono_id, "yr": target_year, "mo": target_month},
    ).fetchone()

    if existing.cnt > 0:
        raise HTTPException(
            status_code=400,
            detail="Ya tenés reservas para ese mes en este abono.",
        )

    # Obtener patrón (día ISO, hora) de las reservas actuales del abono
    patrones = db.execute(
        text("""
            SELECT DISTINCT
                EXTRACT(ISODOW FROM cp.fecha)::int AS dow,
                cp.hora
            FROM abono_reservas ar
            JOIN reservas r            ON r.id  = ar.reserva_id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE ar.abono_id = :abono_id
              AND r.estado NOT IN ('cancelada'::estado_reserva)
            ORDER BY dow, cp.hora
        """),
        {"abono_id": abono_id},
    ).fetchall()

    if not patrones:
        raise HTTPException(
            status_code=400,
            detail="No se encontraron sesiones de referencia para renovar.",
        )

    db_medio = _MEDIO_PAGO_MAP.get(medio_pago.lower(), medio_pago)
    mp_row = db.execute(
        text(
            "SELECT id FROM medios_pago WHERE nombre = :nombre AND activo = true LIMIT 1"
        ),
        {"nombre": db_medio},
    ).fetchone()
    mp_id = mp_row.id if mp_row else _get_efectivo_id(db)

    zona = db.execute(
        text("SELECT precio FROM zonas WHERE id = :id"), {"id": abono.zona_id}
    ).fetchone()

    nuevas = []
    sin_cupo = []

    for p in patrones:
        cp = db.execute(
            text("""
                SELECT cp.id
                FROM clases_programadas cp
                WHERE cp.zona_id                         = :zid
                  AND EXTRACT(YEAR  FROM cp.fecha)::int  = :yr
                  AND EXTRACT(MONTH FROM cp.fecha)::int  = :mo
                  AND EXTRACT(ISODOW FROM cp.fecha)::int = :dow
                  AND cp.hora                            = :hora
                  AND cp.activo                          = true
                  AND cp.cupo_disponible                 > 0
                ORDER BY cp.fecha
                LIMIT 1
            """),
            {
                "zid": abono.zona_id,
                "yr": target_year,
                "mo": target_month,
                "dow": p.dow,
                "hora": p.hora,
            },
        ).fetchone()

        if cp:
            nuevas.append(cp.id)
        else:
            sin_cupo.append(f"día {p.dow} {str(p.hora)[:5]}")

    if not nuevas:
        raise HTTPException(
            status_code=400,
            detail="No hay clases con cupo disponible para los horarios de tu abono en ese mes.",
        )

    try:
        for cp_id in nuevas:
            reserva_row = db.execute(
                text("""
                    INSERT INTO reservas
                        (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total)
                    VALUES (:uid, :cpid, :mpid, :precio, :monto_total)
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """),
                {
                    "uid": abono.usuario_id,
                    "cpid": cp_id,
                    "mpid": mp_id,
                    "precio": float(zona.precio),
                    "monto_total": float(zona.precio),
                },
            ).fetchone()

            if reserva_row:
                db.execute(
                    text("""
                        INSERT INTO abono_reservas (abono_id, reserva_id)
                        VALUES (:abono_id, :reserva_id)
                        ON CONFLICT DO NOTHING
                    """),
                    {"abono_id": abono_id, "reserva_id": reserva_row.id},
                )
                db.execute(
                    text(
                        "UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1 WHERE id = :id"
                    ),
                    {"id": cp_id},
                )

        # Crear pago_abono para el mes destino
        dia_lim = abono.dia_limite_pago
        try:
            fecha_venc = date_type(target_year, target_month, dia_lim)
        except ValueError:
            fecha_venc = date_type(target_year, target_month, 28)

        db.execute(
            text("""
                INSERT INTO pagos_abono
                    (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
                VALUES (:aid, :mpid, :yr, :mo, :fv, :monto, 'pendiente'::estado_pago_abono)
                ON CONFLICT (abono_id, anio, mes) DO NOTHING
            """),
            {
                "aid": abono_id,
                "mpid": mp_id,
                "yr": target_year,
                "mo": target_month,
                "fv": fecha_venc,
                "monto": float(abono.monto_mensual),
            },
        )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Error al renovar. Puede que ya tengas una reserva para alguno de esos slots.",
        )

    aviso = f"Sin cupo para: {', '.join(sin_cupo)}." if sin_cupo else None
    return {"ok": True, "renovadas": len(nuevas), "aviso": aviso}


# ── POST /abonos/{abono_id}/modificar ─────────────────────────────────────────


class ModificarSesionRequest(BaseModel):
    reserva_id_quitar: int
    nueva_fecha: str
    nueva_hora: str


@router.post("/{abono_id}/modificar")
def modificar_sesion_abono(
    abono_id: int,
    data: ModificarSesionRequest,
    db: Session = Depends(get_db),
):
    """Cancela una sesión del abono y reserva una nueva, respetando 1 por semana."""
    abono = db.execute(
        text("SELECT id, usuario_id, zona_id FROM abonos WHERE id = :id"),
        {"id": abono_id},
    ).fetchone()
    if not abono:
        raise HTTPException(status_code=404, detail="Abono no encontrado.")

    # Verificar que la reserva a quitar pertenece a este abono
    old_r = db.execute(
        text("""
            SELECT r.id, r.clase_programada_id, r.estado::text AS estado,
                   r.medio_pago_id, r.precio_pagado, r.monto_total, r.pack_id
            FROM abono_reservas ar
            JOIN reservas r            ON r.id  = ar.reserva_id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE ar.abono_id  = :abono_id
              AND r.id         = :rid
              AND r.estado NOT IN ('cancelada'::estado_reserva)
        """),
        {"abono_id": abono_id, "rid": data.reserva_id_quitar},
    ).fetchone()

    if not old_r:
        raise HTTPException(
            status_code=404, detail="Sesión no encontrada en este abono o ya cancelada."
        )

    # Semanas ocupadas por las otras reservas del abono (excluyendo la que se quita)
    today = date_type.today()
    restantes = db.execute(
        text("""
            SELECT cp.fecha
            FROM abono_reservas ar
            JOIN reservas r            ON r.id  = ar.reserva_id
            JOIN clases_programadas cp ON cp.id = r.clase_programada_id
            WHERE ar.abono_id  = :abono_id
              AND r.id        != :rid
              AND cp.fecha    >= :hoy
              AND r.estado NOT IN ('cancelada'::estado_reserva)
        """),
        {"abono_id": abono_id, "rid": data.reserva_id_quitar, "hoy": today},
    ).fetchall()

    nueva_fecha_obj = date_type.fromisoformat(data.nueva_fecha)

    def iso_week(d):
        return d.isocalendar()[:2]

    for r in restantes:
        if iso_week(r.fecha) == iso_week(nueva_fecha_obj):
            raise HTTPException(
                status_code=400,
                detail="Ya tenés una sesión en esa semana del calendario.",
            )

    # Buscar clase_programada para la nueva fecha/hora
    new_cp = db.execute(
        text("""
            SELECT cp.id, cp.cupo_disponible
            FROM clases_programadas cp
            WHERE cp.zona_id            = :zid
              AND cp.fecha              = :fecha
              AND cp.hora               = :hora
              AND cp.activo             = true
              AND cp.cupo_disponible    > 0
        """),
        {"zid": abono.zona_id, "fecha": data.nueva_fecha, "hora": data.nueva_hora},
    ).fetchone()

    if not new_cp:
        raise HTTPException(
            status_code=400, detail="Sin cupo disponible para la nueva fecha y horario."
        )

    # Verificar que el usuario no tenga ya esa clase reservada
    dup = db.execute(
        text("""
            SELECT id FROM reservas
            WHERE usuario_id = :uid AND clase_programada_id = :cpid
              AND estado NOT IN ('cancelada'::estado_reserva)
        """),
        {"uid": abono.usuario_id, "cpid": new_cp.id},
    ).fetchone()
    if dup:
        raise HTTPException(
            status_code=400, detail="Ya tenés una reserva para ese horario."
        )

    try:
        # Cancelar sesión antigua y liberar cupo
        db.execute(
            text(
                "UPDATE reservas SET estado = 'cancelada'::estado_reserva WHERE id = :id"
            ),
            {"id": data.reserva_id_quitar},
        )
        db.execute(
            text(
                "UPDATE clases_programadas SET cupo_disponible = cupo_disponible + 1 WHERE id = :id"
            ),
            {"id": old_r.clase_programada_id},
        )
        # Crear nueva reserva heredando estado, medio de pago y montos de la original
        result = db.execute(
        text("""
            INSERT INTO reservas
                (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, pack_id, estado)
            VALUES (:uid, :cpid, :mpid, :precio, :monto_total, :pack_id, CAST(:estado AS estado_reserva))
            RETURNING id
        """),
        {
            "uid": abono.usuario_id,
            "cpid": new_cp.id,
            "mpid": old_r.medio_pago_id,
            "precio": float(old_r.precio_pagado),
            "monto_total": float(old_r.monto_total),
            "pack_id": old_r.pack_id,
            "estado": old_r.estado,
        },
        )
        nueva_reserva = result.fetchone()
        # Actualizar abono_reservas: quitar la vieja, agregar la nueva
        db.execute(
            text(
                "DELETE FROM abono_reservas WHERE abono_id = :abono_id AND reserva_id = :reserva_id"
            ),
            {"abono_id": abono_id, "reserva_id": data.reserva_id_quitar},
        )
        db.execute(
            text("""
                INSERT INTO abono_reservas (abono_id, reserva_id)
                VALUES (:abono_id, :reserva_id)
            """),
            {"abono_id": abono_id, "reserva_id": nueva_reserva.id},
        )
        db.execute(
            text(
                "UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1 WHERE id = :id"
            ),
            {"id": new_cp.id},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Error al modificar la sesión. Intentá de nuevo."
        )

    return {"ok": True}