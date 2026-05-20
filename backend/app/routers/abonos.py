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
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/mis-abonos")
def get_mis_abonos(usuario_id: int, db: Session = Depends(get_db)):
    """Devuelve todos los abonos del usuario con sus pagos asociados."""
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
    zona = db.execute(
        text("SELECT id, precio FROM zonas WHERE id = :id"),
        {"id": data.zona_id},
    ).fetchone()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    db_medio = _MEDIO_PAGO_MAP.get(data.medio_pago, data.medio_pago)
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
        text("SELECT id FROM abonos WHERE usuario_id = :uid AND zona_id = :zid"),
        {"uid": data.usuario_id, "zid": data.zona_id},
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tenés un abono para esta zona.")

    # Validate all slots before writing anything
    clase_programadas = []
    for item in data.turnos:
        cp = db.execute(
            text("""
                SELECT cp.id, cp.cupo_disponible
                FROM clases_programadas cp
                JOIN clases c ON c.id = cp.clase_id
                WHERE cp.fecha = :fecha
                  AND cp.hora = :hora
                  AND c.zona_id = :zona_id
                  AND cp.activo = true
                  AND c.activo = true
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
        clase_programadas.append(cp)

    try:
        today = date_type.today()

        abono_row = db.execute(
            text("""
                INSERT INTO abonos
                    (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
                VALUES (:uid, :zid, :fi, :mm, 10, 'activo', true)
                RETURNING id
            """),
            {
                "uid": data.usuario_id,
                "zid": data.zona_id,
                "fi": today,
                "mm": float(zona.precio),
            },
        ).fetchone()
        abono_id = abono_row.id

        for cp in clase_programadas:
            db.execute(
                text("""
                    INSERT INTO reservas
                        (usuario_id, clase_programada_id, medio_pago_id, precio_pagado)
                    VALUES (:uid, :cpid, :mpid, :precio)
                """),
                {
                    "uid": data.usuario_id,
                    "cpid": cp.id,
                    "mpid": medio_pago.id,
                    "precio": float(zona.precio),
                },
            )
            db.execute(
                text(
                    "UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1 WHERE id = :id"
                ),
                {"id": cp.id},
            )

        # First pago_abono: current month if day <= limit, else next month
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
                "monto": float(zona.precio),
            },
        )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya tenés un abono activo para esta zona o una reserva duplicada.",
        )

    return {"ok": True, "abono_id": abono_id}
