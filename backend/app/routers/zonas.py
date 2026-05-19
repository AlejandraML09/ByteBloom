from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from pydantic import BaseModel, field_validator
from datetime import datetime, date

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Zona, ZonaEnum

router = APIRouter(prefix="/api", tags=["zonas"])


# 📦 Dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ZonaResponse(BaseModel):
    id: int
    nombre: ZonaEnum
    descripcion: str | None = None
    precio: int
    activo: bool

    class Config:
        from_attributes = True


@router.get("/zonas", response_model=list[ZonaResponse])
def listar_zonas(db: Session = Depends(get_db)):
    """Obtiene las zonas disponibles"""
    zonas = db.query(Zona).all()
    return zonas


class ModificarPrecioRequest(BaseModel):
    nuevo_precio: float
    zona_id: int | None = None


@router.get("/precios")
def obtener_precio_global(db: Session = Depends(get_db)):
    """Devuelve un precio 'actual' para la UI (toma la primera zona si existe)."""
    zona = db.query(Zona).order_by(Zona.id).first()
    if not zona:
        return {"precio": 0}
    return {"precio": float(zona.precio)}


@router.post("/precios")
def modificar_precios(data: ModificarPrecioRequest, db: Session = Depends(get_db)):
    """Modifica el precio en las zonas. Si `zona_id` está presente, afecta sólo esa zona,
    si no, se aplica a todas las zonas.
    """
    if data.nuevo_precio <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0.")

    if data.zona_id:
        zona = db.query(Zona).filter(Zona.id == data.zona_id).first()
        if not zona:
            raise HTTPException(status_code=404, detail="Zona no encontrada.")
        zona.precio = data.nuevo_precio
    else:
        # Actualiza todas las zonas
        db.query(Zona).update({"precio": data.nuevo_precio})

    db.commit()
    return {"mensaje": "Precios actualizados correctamente."}
