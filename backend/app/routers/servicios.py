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
    fecha: str
    hora: str
    precio: int
    inscritos: int

    class Config:
        from_attributes = True


class ModificarPrecioRequest(BaseModel):
    zona: str
    nuevo_precio: int


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


# 🔧 POST: Modificar precio de clases
@router.post("/precios")
def modificar_precio(data: ModificarPrecioRequest, db: Session = Depends(get_db)):
    """Modifica el precio de las próximas clases sin inscriptos de una zona"""
    
    if data.nuevo_precio <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")
    
    # Actualizar clases sin inscriptos de la zona seleccionada
    clases_actualizadas = db.query(models.Clase).filter(
        models.Clase.zona == data.zona,
        models.Clase.inscritos == 0,
        models.Clase.fecha >= date.today()
    ).all()
    
    if not clases_actualizadas:
        raise HTTPException(
            status_code=404, 
            detail="No hay clases sin inscriptos para esa zona"
        )
    
    for clase in clases_actualizadas:
        clase.precio = data.nuevo_precio
    
    db.commit()
    
    return {
        "mensaje": "Modificación exitosa",
        "zona": data.zona,
        "nuevo_precio": data.nuevo_precio,
        "clases_actualizadas": len(clases_actualizadas)
    }


# 📊 GET: Obtener precios actuales por zona
@router.get("/precios")
def obtener_precios(db: Session = Depends(get_db)):
    """Obtiene el precio más reciente de cada zona"""
    
    zonas = ["superior", "medio", "inferior"]
    precios = {}
    
    for zona in zonas:
        clase = db.query(models.Clase).filter(
            models.Clase.zona == zona
        ).order_by(models.Clase.fecha.desc()).first()
        
        precios[zona] = clase.precio if clase else 0
    
    return precios
