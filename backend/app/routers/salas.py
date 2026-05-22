from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date

from app.database import SessionLocal
from app.models import Sala, ClaseProgramada

router = APIRouter(prefix="/api/salas", tags=["salas"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ───────────────────────────────────────────────────────────────────


class CrearSalaRequest(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    cupo: int

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío.")
        if len(v) > 80:
            raise ValueError("El nombre no puede superar 80 caracteres.")
        return v

    @field_validator("cupo")
    @classmethod
    def cupo_positivo(cls, v):
        if v < 1:
            raise ValueError("El cupo debe ser al menos 1.")
        return v


class EditarSalaRequest(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cupo: Optional[int] = None
    activo: Optional[bool] = None

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío.")
        if len(v) > 80:
            raise ValueError("El nombre no puede superar 80 caracteres.")
        return v

    @field_validator("cupo")
    @classmethod
    def cupo_positivo(cls, v):
        if v is not None and v < 1:
            raise ValueError("El cupo debe ser al menos 1.")
        return v


class SalaResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    cupo: int
    activo: bool

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("", response_model=SalaResponse, status_code=201)
def crear_sala(body: CrearSalaRequest, db: Session = Depends(get_db)):
    existente = db.query(Sala).filter(Sala.nombre == body.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una sala con ese nombre.")

    sala = Sala(nombre=body.nombre, descripcion=body.descripcion, cupo=body.cupo)
    db.add(sala)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ya existe una sala con ese nombre.")
    db.refresh(sala)
    return sala


@router.get("", response_model=list[SalaResponse])
def listar_salas(incluir_inactivas: bool = False, db: Session = Depends(get_db)):
    q = db.query(Sala)
    if not incluir_inactivas:
        q = q.filter(Sala.activo == True)
    return q.order_by(Sala.nombre).all()


@router.get("/{sala_id}", response_model=SalaResponse)
def obtener_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")
    return sala


@router.patch("/{sala_id}", response_model=SalaResponse)
def editar_sala(sala_id: int, body: EditarSalaRequest, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")

    if body.nombre is not None and body.nombre != sala.nombre:
        existente = db.query(Sala).filter(Sala.nombre == body.nombre, Sala.id != sala_id).first()
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe una sala con ese nombre.")
        sala.nombre = body.nombre

    if body.descripcion is not None:
        sala.descripcion = body.descripcion
    if body.cupo is not None:
        sala.cupo = body.cupo
    if body.activo is not None:
        sala.activo = body.activo

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ya existe una sala con ese nombre.")
    db.refresh(sala)
    return sala


@router.delete("/{sala_id}", status_code=200)
def desactivar_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")

    tiene_clases_futuras = (
        db.query(ClaseProgramada)
        .filter(
            ClaseProgramada.sala_id == sala_id,
            ClaseProgramada.activo == True,
            ClaseProgramada.fecha >= date.today(),
        )
        .first()
        is not None
    )
    if tiene_clases_futuras:
        raise HTTPException(
            status_code=409,
            detail="La sala tiene clases programadas futuras. Cancelalas primero o desactivá esas clases.",
        )

    sala.activo = False
    db.commit()
    return {"mensaje": "Sala desactivada.", "sala_id": sala_id}
