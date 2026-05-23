from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional
from datetime import date as date_type
from app.database import SessionLocal
from app import models

router = APIRouter(tags=["turnos"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TurnoItem(BaseModel):
    fecha: str  # "YYYY-MM-DD"
    hora: str   # "HH:MM"


class ReservaRequest(BaseModel):
    zona_id: int
    turnos: list[TurnoItem]
    medio_pago: str
    usuario_id: Optional[int] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/disponibilidad")
def get_disponibilidad(mes: str, db: Session = Depends(get_db)):
    """
    Devuelve las clases programadas del mes con disponibilidad.
    mes: "YYYY-MM"
    """
    try:
        anio, month = mes.split("-")
        anio = int(anio)
        month = int(month)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400, detail="El parámetro 'mes' debe tener formato YYYY-MM."
        )

    rows = (
        db.query(models.ClaseProgramada, models.Zona, models.Sala)
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.Sala, models.ClaseProgramada.sala_id == models.Sala.id)
        .filter(
            models.ClaseProgramada.fecha >= date_type(anio, month, 1),
            models.ClaseProgramada.fecha
            < date_type(anio + (month // 12), (month % 12) + 1, 1),
            models.ClaseProgramada.activo == True,
        )
        .order_by(models.ClaseProgramada.fecha, models.ClaseProgramada.hora)
        .all()
    )

    return [
        {
            "id": cp.id,
            "fecha": str(cp.fecha),
            "hora": str(cp.hora)[:5],
            "cupo_disponible": cp.cupo_disponible,
            "cupo_maximo": cp.cupo_inicial,
            "zona_id": z.id,
            "zona_nombre": z.nombre,
            "sala_id": s.id,
            "sala_nombre": s.nombre,
            "profesional_email": cp.profesional_email,
            "precio": float(z.precio),
        }
        for cp, z, s in rows
    ]


@router.post("/reservar")
def reservar(data: ReservaRequest, db: Session = Depends(get_db)):
    """
    Reserva uno o más turnos. Busca la clase_programada por fecha/hora/zona_id.
    No vincula a abono — para reservas con abono usar /abonos/solicitar.
    """
    zona = db.query(models.Zona).filter(models.Zona.id == data.zona_id).first()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    medio_pago = (
        db.query(models.MedioPago)
        .filter(
            models.MedioPago.nombre == data.medio_pago,
            models.MedioPago.activo == True,
        )
        .first()
    )
    if not medio_pago:
        raise HTTPException(
            status_code=400,
            detail=f"Medio de pago '{data.medio_pago}' no disponible.",
        )

    # Validar todos los slots antes de insertar nada
    clase_programadas = []
    for item in data.turnos:
        try:
            fecha_obj = date_type.fromisoformat(item.fecha)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Fecha inválida: {item.fecha}. Usá formato YYYY-MM-DD.",
            )

        cp = (
            db.query(models.ClaseProgramada)
            .filter(
                models.ClaseProgramada.fecha == fecha_obj,
                models.ClaseProgramada.hora == item.hora,
                models.ClaseProgramada.zona_id == data.zona_id,
                models.ClaseProgramada.activo == True,
            )
            .first()
        )
        if not cp:
            raise HTTPException(
                status_code=404,
                detail=f"No hay clase programada para {item.fecha} a las {item.hora} en la zona seleccionada.",
            )
        if cp.cupo_disponible <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Sin cupos disponibles para {item.fecha} a las {item.hora}.",
            )
        if data.usuario_id is not None:
            existing = (
                db.query(models.Reserva)
                .filter(
                    models.Reserva.usuario_id == data.usuario_id,
                    models.Reserva.clase_programada_id == cp.id,
                    models.Reserva.estado != models.EstadoReserva.cancelada,
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya tenés una reserva activa para el {item.fecha} a las {item.hora}.",
                )
        clase_programadas.append(cp)

    try:
        for cp in clase_programadas:
            db.add(
                models.Reserva(
                    usuario_id=data.usuario_id,
                    clase_programada_id=cp.id,
                    medio_pago_id=medio_pago.id,
                    precio_pagado=zona.precio,
                )
            )
            cp.cupo_disponible -= 1
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya tenés una reserva activa para uno de los horarios seleccionados.",
        )

    return {"ok": True, "reservados": len(clase_programadas)}


@router.get("/mis-turnos")
def get_mis_turnos(usuario_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las reservas del usuario, ordenadas por fecha descendente."""
    rows = (
        db.query(
            models.Reserva,
            models.ClaseProgramada,
            models.Zona,
            models.MedioPago,
        )
        .join(
            models.ClaseProgramada,
            models.Reserva.clase_programada_id == models.ClaseProgramada.id,
        )
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.MedioPago, models.Reserva.medio_pago_id == models.MedioPago.id)
        .filter(models.Reserva.usuario_id == usuario_id)
        .order_by(
            models.ClaseProgramada.fecha.desc(), models.ClaseProgramada.hora.desc()
        )
        .all()
    )
    return [
        {
            "id": r.id,
            "clase_programada_id": r.clase_programada_id,
            "fecha": str(cp.fecha),
            "hora": str(cp.hora)[:5],
            "zona": z.nombre,
            "medio_pago": mp.nombre,
            "estado": r.estado,
            "precio_pagado": float(r.precio_pagado),
            "fecha_reserva": r.fecha_reserva.isoformat() if r.fecha_reserva else None,
        }
        for r, cp, z, mp in rows
    ]