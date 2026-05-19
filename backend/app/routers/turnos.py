from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, String as SAString
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional
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
    hora: str  # "HH:MM"


class ReservaRequest(BaseModel):
    zona_id: int
    turnos: list[TurnoItem]
    medio_pago: str
    usuario_id: Optional[int] = None


@router.get("/disponibilidad")
def get_disponibilidad(mes: str, db: Session = Depends(get_db)):
    """
    Returns scheduled classes for the given month with availability.
    mes: "YYYY-MM"
    """
    rows = (
        db.query(models.ClaseProgramada, models.Clase, models.Zona)
        .join(models.Clase, models.ClaseProgramada.clase_id == models.Clase.id)
        .join(models.Zona, models.Clase.zona_id == models.Zona.id)
        .filter(
            cast(models.ClaseProgramada.fecha, SAString).startswith(mes),
            models.ClaseProgramada.activo == True,
            models.Clase.activo == True,
        )
        .order_by(models.ClaseProgramada.fecha, models.ClaseProgramada.hora)
        .all()
    )
    return [
        {
            "id": cp.id,
            "clase_id": cp.clase_id,
            "fecha": str(cp.fecha),
            "hora": str(cp.hora)[:5],  # TIME gives "HH:MM:SS", truncate to "HH:MM"
            "cupo_disponible": cp.cupo_disponible,
            "cupo_maximo": c.cupo_maximo,
            "zona_id": z.id,
            "zona_nombre": z.nombre,
        }
        for cp, c, z in rows
    ]


@router.post("/reservar")
def reservar(data: ReservaRequest, db: Session = Depends(get_db)):
    """
    Books one or more shifts. Looks up clase_programada by fecha/hora/zona_id.
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

    # Validate all slots before inserting anything
    clase_programadas = []
    for item in data.turnos:
        cp = (
            db.query(models.ClaseProgramada)
            .join(models.Clase, models.ClaseProgramada.clase_id == models.Clase.id)
            .filter(
                models.ClaseProgramada.fecha == item.fecha,
                models.ClaseProgramada.hora == item.hora,
                models.Clase.zona_id == data.zona_id,
                models.ClaseProgramada.activo == True,
                models.Clase.activo == True,
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
        # Check the user doesn't already have an active booking for this slot
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
    """Returns all reservas for a given user, sorted newest first."""
    rows = (
        db.query(
            models.Reserva,
            models.ClaseProgramada,
            models.Clase,
            models.Zona,
            models.MedioPago,
        )
        .join(
            models.ClaseProgramada,
            models.Reserva.clase_programada_id == models.ClaseProgramada.id,
        )
        .join(models.Clase, models.ClaseProgramada.clase_id == models.Clase.id)
        .join(models.Zona, models.Clase.zona_id == models.Zona.id)
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
            "fecha": str(cp.fecha),
            "hora": str(cp.hora)[:5],
            "zona": z.nombre,
            "medio_pago": mp.nombre,
            "estado": r.estado,
            "precio_pagado": float(r.precio_pagado),
            "fecha_reserva": r.fecha_reserva.isoformat() if r.fecha_reserva else None,
        }
        for r, cp, c, z, mp in rows
    ]
