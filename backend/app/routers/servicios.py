from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from app.database import SessionLocal
from app import models

router = APIRouter(prefix="/api", tags=["servicios"])

# 📦 Schemas
class ClaseResponse(BaseModel):
    id: int
    zona: str
    fecha: date
    hora: str
    cupo_max: int
    inscritos: int
    cancelada: int

    class Config:
        from_attributes = True


class ModificarPrecioRequest(BaseModel):
    nuevo_precio: int


class ModificarCupoRequest(BaseModel):
    zona: str
    fecha: str
    hora: str
    nuevo_cupo: int


class CancelarClaseRequest(BaseModel):
    zona: str
    fecha: str
    hora: str


# 📦 Dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 📋 GET: Obtener próximas clases sin inscriptos
@router.get("/clases", response_model=list[ClaseResponse])
def obtener_clases_sin_inscriptos(db: Session = Depends(get_db)):
    """Obtiene las próximas clases programadas sin inscriptos o con pocos"""
    clases = db.query(models.Clase).filter(
        models.Clase.inscritos == 0,
        models.Clase.fecha >= date.today()
    ).order_by(models.Clase.fecha, models.Clase.hora).all()
    return clases


# 📋 GET: Obtener clases sin inscriptos para cupo
@router.get("/cupos", response_model=list[ClaseResponse])
def obtener_clases_para_cupos(db: Session = Depends(get_db)):
    """Obtiene todas las clases sin inscriptos para gestión de cupos"""
    clases = db.query(models.Clase).filter(
        models.Clase.inscritos == 0
    ).order_by(models.Clase.fecha, models.Clase.hora).all()
    return clases


# 🔧 POST: Modificar cupo de una clase
@router.post("/cupos")
def modificar_cupo(data: ModificarCupoRequest, db: Session = Depends(get_db)):
    """Modifica el cupo máximo de una clase que aún no tiene inscriptos"""
    if data.nuevo_cupo <= 0:
        raise HTTPException(status_code=400, detail="El cupo debe ser mayor a 0")

    try:
        fecha_obj = date.fromisoformat(data.fecha)
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida")

    clase = db.query(models.Clase).filter(
        models.Clase.zona == data.zona,
        models.Clase.fecha == fecha_obj,
        models.Clase.hora == data.hora,
        models.Clase.inscritos == 0,
    ).first()

    if not clase:
        raise HTTPException(
            status_code=404,
            detail="No se encontró una clase sin inscriptos para los datos ingresados"
        )

    clase.cupo_max = data.nuevo_cupo
    db.commit()

    return {
        "mensaje": "Modificación exitosa",
        "id": clase.id,
        "zona": clase.zona,
        "fecha": clase.fecha.isoformat(),
        "hora": clase.hora,
        "nuevo_cupo": clase.cupo_max,
    }


# 🔧 POST: Modificar precio global
@router.post("/precios")
def modificar_precio(data: ModificarPrecioRequest, db: Session = Depends(get_db)):
    """Modifica el precio único global en la tabla configuracion"""
    if data.nuevo_precio <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")

    config = db.query(models.Configuracion).filter(models.Configuracion.id == 1).first()
    if not config:
        config = models.Configuracion(id=1, precio=data.nuevo_precio)
        db.add(config)
    else:
        config.precio = data.nuevo_precio

    db.commit()

    return {
        "mensaje": "Precio actualizado exitosamente",
        "nuevo_precio": data.nuevo_precio,
    }


# 📊 GET: Obtener precio actual
@router.get("/precios")
def obtener_precios(db: Session = Depends(get_db)):
    """Obtiene el precio global desde configuracion"""
    config = db.query(models.Configuracion).filter(models.Configuracion.id == 1).first()
    return {"precio": config.precio if config else 0}


# 🚫 GET: Obtener clases disponibles para cancelar
@router.get("/clases-cancelar", response_model=list[ClaseResponse])
def obtener_clases_cancelar(db: Session = Depends(get_db)):
    """Obtiene todas las clases no canceladas."""
    clases = db.query(models.Clase).filter(
        models.Clase.cancelada == 0,
        models.Clase.fecha >= date.today()
    ).order_by(models.Clase.fecha, models.Clase.hora).all()
    return clases


# 🚫 POST: Cancelar una clase
@router.post("/clases-cancelar")
def cancelar_clase(data: CancelarClaseRequest, db: Session = Depends(get_db)):
    """Cancela una clase que aún no está cancelada."""
    try:
        fecha_obj = date.fromisoformat(data.fecha)
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida")

    clase = db.query(models.Clase).filter(
        models.Clase.zona == data.zona,
        models.Clase.fecha == fecha_obj,
        models.Clase.hora == data.hora,
    ).first()

    if not clase:
        raise HTTPException(
            status_code=404,
            detail="No se encontró una clase con los datos ingresados"
        )

    if clase.cancelada:
        raise HTTPException(
            status_code=400,
            detail="La clase ingresada ya se encuentra cancelada"
        )

    clase.cancelada = 1
    db.commit()

    return {
        "mensaje": "La clase ha sido cancelada exitosamente",
        "id": clase.id,
        "zona": clase.zona,
        "fecha": clase.fecha.isoformat(),
        "hora": clase.hora,
    }