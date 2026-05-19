from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, String as SAString
from pydantic import BaseModel
from datetime import date
from app.database import SessionLocal
from app import models

router = APIRouter(prefix="/api", tags=["servicios"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ClaseProgramadaResponse(BaseModel):
    id: int
    clase_id: int
    zona_id: int
    zona_nombre: str
    fecha: str
    hora: str
    cupo_maximo: int
    cupo_disponible: int

    class Config:
        from_attributes = True


class ModificarCupoRequest(BaseModel):
    zona_id: int
    fecha: str
    hora: str
    nuevo_cupo: int


class CancelarClaseRequest(BaseModel):
    clase_programada_id: int


def _query_clases_programadas(db: Session, solo_sin_inscritos: bool = False):
    q = (
        db.query(models.ClaseProgramada, models.Clase, models.Zona)
        .join(models.Clase, models.ClaseProgramada.clase_id == models.Clase.id)
        .join(models.Zona, models.Clase.zona_id == models.Zona.id)
        .filter(
            models.ClaseProgramada.fecha >= date.today(),
            models.ClaseProgramada.activo == True,
            models.Clase.activo == True,
        )
    )
    if solo_sin_inscritos:
        # No registrations yet: cupo_disponible equals cupo_maximo
        q = q.filter(models.ClaseProgramada.cupo_disponible == models.Clase.cupo_maximo)
    return q.order_by(models.ClaseProgramada.fecha, models.ClaseProgramada.hora).all()


def _rows_to_response(rows):
    return [
        ClaseProgramadaResponse(
            id=cp.id,
            clase_id=cp.clase_id,
            zona_id=z.id,
            zona_nombre=z.nombre,
            fecha=str(cp.fecha),
            hora=str(cp.hora)[:5],  # TIME gives "HH:MM:SS", truncate to "HH:MM"
            cupo_maximo=c.cupo_maximo,
            cupo_disponible=cp.cupo_disponible,
        )
        for cp, c, z in rows
    ]


@router.get("/clases", response_model=list[ClaseProgramadaResponse])
def obtener_clases(db: Session = Depends(get_db)):
    """Upcoming scheduled classes with availability."""
    return _rows_to_response(_query_clases_programadas(db))


@router.get("/cupos", response_model=list[ClaseProgramadaResponse])
def obtener_clases_para_cupos(db: Session = Depends(get_db)):
    """Upcoming scheduled classes that have no bookings yet."""
    return _rows_to_response(_query_clases_programadas(db, solo_sin_inscritos=True))


@router.post("/cupos")
def modificar_cupo(data: ModificarCupoRequest, db: Session = Depends(get_db)):
    """Update cupo_disponible for a scheduled class (only if no bookings yet)."""
    if data.nuevo_cupo <= 0:
        raise HTTPException(status_code=400, detail="El cupo debe ser mayor a 0.")

    cp = (
        db.query(models.ClaseProgramada)
        .join(models.Clase, models.ClaseProgramada.clase_id == models.Clase.id)
        .filter(
            models.ClaseProgramada.fecha == data.fecha,
            models.ClaseProgramada.hora == data.hora,
            models.Clase.zona_id == data.zona_id,
            models.ClaseProgramada.activo == True,
            models.Clase.activo == True,
            models.ClaseProgramada.cupo_disponible == models.Clase.cupo_maximo,
        )
        .first()
    )

    if not cp:
        raise HTTPException(
            status_code=404,
            detail="No se encontró una clase sin inscriptos para los datos ingresados.",
        )

    cp.cupo_disponible = data.nuevo_cupo
    # Also update cupo_maximo on the clase template
    clase = db.query(models.Clase).filter(models.Clase.id == cp.clase_id).first()
    clase.cupo_maximo = data.nuevo_cupo
    db.commit()

    return {
        "mensaje": "Modificación exitosa",
        "clase_programada_id": cp.id,
        "nuevo_cupo": data.nuevo_cupo,
    }


@router.get("/clases-cancelar", response_model=list[ClaseProgramadaResponse])
def obtener_clases_cancelar(db: Session = Depends(get_db)):
    """Upcoming active scheduled classes available for cancellation."""
    return _rows_to_response(_query_clases_programadas(db))


@router.post("/clases-cancelar")
def cancelar_clase(data: CancelarClaseRequest, db: Session = Depends(get_db)):
    """Cancel a specific scheduled class instance."""
    cp = (
        db.query(models.ClaseProgramada)
        .filter(models.ClaseProgramada.id == data.clase_programada_id)
        .first()
    )

    if not cp:
        raise HTTPException(status_code=404, detail="Clase programada no encontrada.")

    if not cp.activo:
        raise HTTPException(
            status_code=400, detail="La clase ya se encuentra cancelada."
        )

    cp.activo = False
    db.commit()

    return {
        "mensaje": "Clase cancelada exitosamente.",
        "clase_programada_id": cp.id,
    }
