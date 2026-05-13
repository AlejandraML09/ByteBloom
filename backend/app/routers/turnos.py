from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app import models

router = APIRouter()

MAX_POR_SLOT = 5


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ──────────────────────────────────────────────────────────────────

class TurnoItem(BaseModel):
    fecha: str   # "YYYY-MM-DD"
    hora: str    # "HH:MM"

class ReservaRequest(BaseModel):
    zona: str
    turnos: list[TurnoItem]
    medio_pago: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/disponibilidad")
def get_disponibilidad(mes: str, db: Session = Depends(get_db)):
    """
    Returns occupancy counts for every booked slot in the given month.
    mes: "YYYY-MM"
    Response: { "YYYY-MM-DD_HH:MM": count, ... }
    """
    rows = (
        db.query(models.Turno)
        .filter(models.Turno.fecha.startswith(mes))
        .all()
    )
    result: dict[str, int] = {}
    for row in rows:
        key = f"{row.fecha}_{row.hora}"
        result[key] = result.get(key, 0) + 1
    return result


@router.post("/reservar")
def reservar(data: ReservaRequest, db: Session = Depends(get_db)):
    """
    Books one or more shifts. Validates capacity before inserting.
    """
    for item in data.turnos:
        taken = (
            db.query(models.Turno)
            .filter(
                models.Turno.fecha == item.fecha,
                models.Turno.hora == item.hora,
            )
            .count()
        )
        if taken >= MAX_POR_SLOT:
            raise HTTPException(
                status_code=400,
                detail=f"Sin cupos disponibles para {item.fecha} a las {item.hora}",
            )

    for item in data.turnos:
        db.add(models.Turno(
            fecha=item.fecha,
            hora=item.hora,
            zona=data.zona,
            medio_pago=data.medio_pago,
        ))

    db.commit()
    return {"ok": True, "reservados": len(data.turnos)}
