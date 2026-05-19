from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from datetime import datetime, date
from app.database import SessionLocal
from app.models import Clase, ClaseProgramada, Configuracion, ZonaEnum

router = APIRouter(prefix="/api/clases", tags=["clases"])


class CrearClaseRequest(BaseModel):
    zona_id: int
    fecha: str  # formato: YYYY-MM-DD
    hora: str  # formato: HH:MM
    cupo_maximo: int
    profesional_email: str | None = None

    @field_validator("zona_id")
    @classmethod
    def zona_no_vacia(cls, v):
        if v < 1:
            raise ValueError("La zona no puede ser menor a 1.")
        return v

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

    @field_validator("cupo_maximo")
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
    zona_id: int
    cupo_maximo: int
    profesional_email: str | None = None
    class Config:
        from_attributes = True


@router.post("", response_model=ClaseResponse, status_code=201)
async def crear_clase(body: CrearClaseRequest):
    db = SessionLocal()
    try:
        print(f"Recibido request para crear clase: {body}")
        nueva_clase = Clase(
            zona_id=body.zona_id,
            cupo_maximo=body.cupo_maximo,
            profesional_email=body.profesional_email,
        )
        print(f"Creando clase con zona_id={body.zona_id}, cupo_maximo={body.cupo_maximo}, profesional_email={body.profesional_email}")
        db.add(nueva_clase)
        db.commit()
        db.refresh(nueva_clase)
        print(f"Clase creada con ID={nueva_clase.id}")
        nueva_clase_programada = ClaseProgramada(
            clase_id=nueva_clase.id,
            fecha=body.fecha,
            hora=body.hora,
            cupo_disponible=body.cupo_maximo
        )
        print(f"Programando clase con ID={nueva_clase_programada.clase_id}, fecha={body.fecha}, hora={body.hora}, cupo_disponible={body.cupo_maximo}")
        db.add(nueva_clase_programada)
        db.commit()
        db.refresh(nueva_clase_programada)
        print(f"Clase programada con ID={nueva_clase_programada.id}")
        return ClaseResponse(
            id=nueva_clase.id,
            zona_id=nueva_clase.zona_id,
            cupo_maximo=nueva_clase.cupo_maximo,
            profesional_email=nueva_clase.profesional_email
        )
    except Exception as e:
        db.rollback()
        print(f"Error al crear la clase: {e}")
        raise HTTPException(
            status_code=500, detail="Error interno al guardar la clase."
        )
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