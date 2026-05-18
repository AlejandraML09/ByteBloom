from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from pydantic import BaseModel, field_validator
from datetime import datetime, date

from requests import Session
from app.database import SessionLocal
from app.models import  Zona, ZonaEnum

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
