from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date as date_type

from app.database import SessionLocal
from app.models import ClaseProgramada, Zona, Sala, Usuario, RolUsuario

router = APIRouter(prefix="/api", tags=["clases"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ───────────────────────────────────────────────────────────────────


class SlotItem(BaseModel):
    fecha: str  # "YYYY-MM-DD"
    hora: str  # "HH:MM"

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


class ProgramarRequest(BaseModel):
    zona_id: int
    sala_id: int
    profesional_email: Optional[str] = None
    slots: list[SlotItem]

    @field_validator("zona_id", "sala_id")
    @classmethod
    def id_valido(cls, v):
        if v < 1:
            raise ValueError("Id inválido.")
        return v

    @field_validator("profesional_email")
    @classmethod
    def email_valido(cls, v):
        if v is None or v == "":
            return None
        if "@" not in v:
            raise ValueError("El email del profesional no es válido.")
        return v.strip().lower()


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/clases/programadas", status_code=201)
def crear_clases_programadas(body: ProgramarRequest, db: Session = Depends(get_db)):
    """Crear clases programadas en bulk. Valida conflictos sala/profesional."""
    if not body.slots:
        raise HTTPException(
            status_code=400, detail="Debés seleccionar al menos un horario."
        )

    zona = db.query(Zona).filter(Zona.id == body.zona_id, Zona.activo == True).first()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada o inactiva.")

    sala = db.query(Sala).filter(Sala.id == body.sala_id, Sala.activo == True).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada o inactiva.")

    if body.profesional_email:
        prof = (
            db.query(Usuario)
            .filter(
                Usuario.email == body.profesional_email,
                Usuario.rol == RolUsuario.profesional,
            )
            .first()
        )
        if not prof:
            raise HTTPException(
                status_code=404, detail="Profesional no encontrado."
            )

    # Acumular conflictos antes de insertar
    conflictos_sala = []
    conflictos_profesional = []
    slots_a_crear = []

    for slot in body.slots:
        fecha_obj = datetime.strptime(slot.fecha, "%Y-%m-%d").date()
        hora_obj = datetime.strptime(slot.hora, "%H:%M").time()

        if fecha_obj < date_type.today():
            raise HTTPException(
                status_code=400,
                detail=f"La fecha {slot.fecha} es anterior a hoy.",
            )

        choque_sala = (
            db.query(ClaseProgramada)
            .filter(
                ClaseProgramada.sala_id == body.sala_id,
                ClaseProgramada.fecha == fecha_obj,
                ClaseProgramada.hora == hora_obj,
                ClaseProgramada.activo == True,
            )
            .first()
        )
        if choque_sala:
            conflictos_sala.append({"fecha": slot.fecha, "hora": slot.hora})
            continue

        if body.profesional_email:
            choque_prof = (
                db.query(ClaseProgramada)
                .filter(
                    ClaseProgramada.profesional_email == body.profesional_email,
                    ClaseProgramada.fecha == fecha_obj,
                    ClaseProgramada.hora == hora_obj,
                    ClaseProgramada.activo == True,
                )
                .first()
            )
            if choque_prof:
                conflictos_profesional.append(
                    {"fecha": slot.fecha, "hora": slot.hora}
                )
                continue

        slots_a_crear.append((fecha_obj, hora_obj))

    if conflictos_sala or conflictos_profesional:
        raise HTTPException(
            status_code=409,
            detail={
                "mensaje": "Conflictos detectados al programar las clases.",
                "conflictos_sala": conflictos_sala,
                "conflictos_profesional": conflictos_profesional,
            },
        )

    for fecha_obj, hora_obj in slots_a_crear:
        db.add(
            ClaseProgramada(
                zona_id=body.zona_id,
                sala_id=body.sala_id,
                profesional_email=body.profesional_email,
                fecha=fecha_obj,
                hora=hora_obj,
                cupo_inicial=sala.cupo,
                cupo_disponible=sala.cupo,
            )
        )
        db.flush()

    db.commit()
    return {"creadas": len(slots_a_crear)}


@router.delete("/clases-programadas/por-profesional/{email}", status_code=200)
def eliminar_clases_programadas_de_profesional(
    email: str, db: Session = Depends(get_db)
):
    """Soft-delete de todas las clases programadas futuras del profesional."""
    clases = (
        db.query(ClaseProgramada)
        .filter(
            ClaseProgramada.profesional_email == email.strip().lower(),
            ClaseProgramada.activo == True,
            ClaseProgramada.fecha >= date_type.today(),
        )
        .all()
    )
    if not clases:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron clases futuras para ese profesional.",
        )
    for cp in clases:
        cp.activo = False
    db.commit()
    return {"eliminadas": len(clases), "profesional_email": email}
