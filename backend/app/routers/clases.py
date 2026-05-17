from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from datetime import datetime, date
from app.database import SessionLocal
from app.models import Clase, Configuracion, ZonaEnum

router = APIRouter(prefix="/api/clases", tags=["clases"])


class CrearClaseRequest(BaseModel):
    zona: str
    fecha: str   # formato: YYYY-MM-DD
    hora: str    # formato: HH:MM
    cupo_max: int
    profesional_email: str | None = None 

    @field_validator("zona")
    @classmethod
    def zona_no_vacia(cls, v):
        if not v.strip():
            raise ValueError("La zona no puede estar vacía.")
        zonas_validas = [z.value for z in ZonaEnum]
        if v.strip() not in zonas_validas:
            raise ValueError(f"Zona inválida. Opciones: {zonas_validas}")
        return v.strip()

    @field_validator("fecha")
    @classmethod
    def fecha_valida(cls, v):
        try:
            fecha = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("La fecha debe tener formato YYYY-MM-DD.")
        if fecha < datetime.today().date():
            raise ValueError("La fecha no puede ser anterior a hoy.")
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
    
    @field_validator("profesional_email")
    @classmethod
    def email_valido(cls, v):
        if v is None:
            return v
        if "@" not in v:
            raise ValueError("El email del profesional no es válido.")
        return v.strip().lower()


class ClaseResponse(BaseModel):
    id: int
    zona: str
    fecha: date
    hora: str
    cupo_max: int
    inscritos: int
    cancelada: int
    profesional_email: str | None = None

    class Config:
        from_attributes = True


@router.post("", response_model=ClaseResponse, status_code=201)
async def crear_clase(body: CrearClaseRequest):
    db = SessionLocal()
    try:
        config = db.query(Configuracion).filter(Configuracion.id == 1).first()
        precio = config.precio if config else 0

        nueva_clase = Clase(
            zona=body.zona,
            fecha=body.fecha,
            hora=body.hora,
            cupo_max=body.cupo_max,
            inscritos=0,
            cancelada=0,
            profesional_email=body.profesional_email
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

@router.delete("/por-profesional/{email}", status_code=200)
async def eliminar_clases_de_profesional(email: str):
    db = SessionLocal()
    try:
        clases = db.query(Clase).filter(
            Clase.profesional_email == email.strip().lower(),
            Clase.cancelada == 0
        ).all()
        if not clases:
            raise HTTPException(status_code=404, detail="No se encontraron clases para ese profesional.")
        for clase in clases:
            clase.cancelada = 1  # soft delete, no borra el registro
        db.commit()
        return {"eliminadas": len(clases), "profesional_email": email}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar las clases.")
    finally:
        db.close()