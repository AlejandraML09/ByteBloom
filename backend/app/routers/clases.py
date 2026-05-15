from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from datetime import datetime
from app.database import SessionLocal
from app.models import Clase

router = APIRouter(prefix="/api/clases", tags=["clases"])


class CrearClaseRequest(BaseModel):
    zona: str
    fecha: str   # formato: YYYY-MM-DD
    hora: str    # formato: HH:MM
    cupo_max: int

    @field_validator("zona")
    @classmethod
    def zona_no_vacia(cls, v):
        if not v.strip():
            raise ValueError("La zona no puede estar vacía.")
        return v.strip()

    @field_validator("fecha")
    @classmethod
    def fecha_valida(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("La fecha debe tener formato YYYY-MM-DD.")
        return v

    @field_validator("hora")
    @classmethod
    def hora_valida(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("El horario debe tener formato HH:MM.")
        return v

    @field_validator("cupo_max")
    @classmethod
    def cupo_positivo(cls, v):
        if v < 1:
            raise ValueError("El cupo máximo debe ser al menos 1.")
        return v


class ClaseResponse(BaseModel):
    id: int
    zona: str
    fecha: str
    hora: str
    cupo_max: int
    inscritos: int
    cancelada: bool


@router.post("", response_model=ClaseResponse, status_code=201)
async def crear_clase(body: CrearClaseRequest):
    db = SessionLocal()
    try:
        nueva_clase = Clase(
            zona=body.zona,
            fecha=body.fecha,
            hora=body.hora,
            cupo_max=body.cupo_max,
            inscritos=0,
            cancelada=False,
        )
        db.add(nueva_clase)
        db.commit()
        db.refresh(nueva_clase)
        return nueva_clase
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al guardar la clase.")
    finally:
        db.close()

