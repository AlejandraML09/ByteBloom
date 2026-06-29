"""Router de reseñas de profesionales.

Una reseña vincula:
  - el usuario que la dejó (usuario_id)
  - el profesional reseñado (profesional_id -> usuarios.id, rol='profesional')
  - la reserva sobre la que se hizo (reserva_id, UNIQUE)

El profesional se resuelve a partir de `clase_programada.profesional_email`.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, field_validator

from app.database import SessionLocal
from app import models

router = APIRouter(prefix="/reviews", tags=["reviews"])

MAX_CARACTERES_COMENTARIO = 160


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def contar_caracteres(texto: str) -> int:
    return len(texto)

# ── Schemas ───────────────────────────────────────────────────────────────────


class CrearResenaRequest(BaseModel):
    usuario_id: int
    reserva_id: int
    rating: int
    comentario: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def _validar_rating(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("El rating debe estar entre 1 y 5.")
        return v

    @field_validator("comentario")
    @classmethod
    def _validar_comentario(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v == "":
            return None
        if contar_caracteres(v) > MAX_CARACTERES_COMENTARIO:
            raise ValueError(
                f"El comentario no puede superar los {MAX_CARACTERES_COMENTARIO} caracteres."
            )
        return v


# ── Helpers ─────────────────────────────────────────────────────────────────


def reserva_esta_pagada(reserva: models.Reserva) -> bool:
    """Pago completo: lo abonado cubre el monto total."""
    return (
        reserva.precio_pagado is not None
        and reserva.monto_total is not None
        and reserva.precio_pagado >= reserva.monto_total
    )


def motivo_no_resenable(reserva: models.Reserva) -> Optional[str]:
    """Devuelve un mensaje de error si la reserva NO es reseñable, o None si lo es.

    Regla de negocio (estricta): solo se puede reseñar una reserva que representa
    una asistencia efectiva con pago confirmado, es decir:
      - estado == 'asistio'  (asistió a la clase; implica que la clase ya ocurrió)
      - pago completo         (precio_pagado >= monto_total)

    Esto excluye explícitamente: pendiente, confirmada-sin-asistir, ausente,
    cancelada, vencida, rechazada y cualquier otro estado.
    """
    if reserva.estado != models.EstadoReserva.asistio:
        return "Solo podés reseñar clases a las que asististe."

    if not reserva_esta_pagada(reserva):
        return "Solo podés reseñar reservas con el pago completo."

    return None


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("")
def crear_resena(data: CrearResenaRequest, db: Session = Depends(get_db)):
    """Crea una reseña para una reserva ya asistida del usuario."""
    reserva = (
        db.query(models.Reserva)
        .filter(models.Reserva.id == data.reserva_id)
        .first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    if reserva.usuario_id != data.usuario_id:
        raise HTTPException(
            status_code=403, detail="Esta reserva no pertenece al usuario."
        )

    cp = (
        db.query(models.ClaseProgramada)
        .filter(models.ClaseProgramada.id == reserva.clase_programada_id)
        .first()
    )
    if not cp:
        raise HTTPException(status_code=404, detail="Clase asociada no encontrada.")

    error = motivo_no_resenable(reserva)
    if error:
        raise HTTPException(status_code=400, detail=error)

    if not cp.profesional_email:
        raise HTTPException(
            status_code=400,
            detail="La clase no tiene un profesional asignado para reseñar.",
        )

    profesional = (
        db.query(models.Usuario)
        .filter(
            models.Usuario.email == cp.profesional_email,
            models.Usuario.rol == models.RolUsuario.profesional,
        )
        .first()
    )
    if not profesional:
        raise HTTPException(
            status_code=404, detail="Profesional de la clase no encontrado."
        )

    # Anti-duplicado (defensa adicional al UNIQUE de la tabla).
    ya_existe = (
        db.query(models.Resena.id)
        .filter(models.Resena.reserva_id == data.reserva_id)
        .first()
    )
    if ya_existe:
        raise HTTPException(
            status_code=409, detail="Ya dejaste una reseña para esta reserva."
        )

    resena = models.Resena(
        usuario_id=data.usuario_id,
        profesional_id=profesional.id,
        reserva_id=data.reserva_id,
        rating=data.rating,
        comentario=data.comentario,
    )
    db.add(resena)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Ya dejaste una reseña para esta reserva."
        )

    db.refresh(resena)
    return {
        "ok": True,
        "id": resena.id,
        "profesional_email": cp.profesional_email,
        "rating": resena.rating,
    }


@router.get("/resumen")
def resumen_puntuacion(db: Session = Depends(get_db)):
    """Promedio y cantidad de reseñas por profesional, en una sola consulta
    agregada (evita N+1). Keyed por email para que el front lo cruce fácil."""
    rows = (
        db.query(
            models.Usuario.email.label("email"),
            func.coalesce(func.avg(models.Resena.rating), 0).label("promedio"),
            func.count(models.Resena.id).label("cantidad"),
        )
        .outerjoin(models.Resena, models.Resena.profesional_id == models.Usuario.id)
        .filter(models.Usuario.rol == models.RolUsuario.profesional)
        .group_by(models.Usuario.email)
        .all()
    )
    return [
        {
            "profesional_email": email,
            "promedio": round(float(promedio), 2),
            "cantidad": int(cantidad),
        }
        for email, promedio, cantidad in rows
    ]


@router.get("/profesional/{email}")
def resenas_de_profesional(
    email: str, limit: int = 10, db: Session = Depends(get_db)
):
    """Últimas reseñas de un profesional + su resumen. Una sola query con JOIN
    al usuario autor para traer el nombre (sin apellido ni email)."""
    profesional = (
        db.query(models.Usuario)
        .filter(
            models.Usuario.email == email,
            models.Usuario.rol == models.RolUsuario.profesional,
        )
        .first()
    )
    if not profesional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado.")

    agg = (
        db.query(
            func.coalesce(func.avg(models.Resena.rating), 0),
            func.count(models.Resena.id),
        )
        .filter(models.Resena.profesional_id == profesional.id)
        .one()
    )
    promedio, cantidad = float(agg[0]), int(agg[1])

    rows = (
        db.query(models.Resena, models.Usuario.nombre)
        .join(models.Usuario, models.Resena.usuario_id == models.Usuario.id)
        .filter(models.Resena.profesional_id == profesional.id)
        .order_by(models.Resena.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "profesional_email": email,
        "promedio": round(promedio, 2),
        "cantidad": cantidad,
        "resenas": [
            {
                "id": r.id,
                "rating": r.rating,
                "comentario": r.comentario,
                "usuario_nombre": nombre,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r, nombre in rows
        ],
    }


@router.get("/carrusel")
def carrusel(limit: int = 12, db: Session = Depends(get_db)):
    """Reseñas recientes con comentario (todas las profesionales) para el
    carrusel del footer. Una sola query con JOINs (sin N+1)."""
    from sqlalchemy.orm import aliased

    autor = aliased(models.Usuario)
    prof = aliased(models.Usuario)

    rows = (
        db.query(
            models.Resena,
            autor.nombre.label("usuario_nombre"),
            prof.nombre.label("prof_nombre"),
            prof.apellido.label("prof_apellido"),
            prof.email.label("prof_email"),
        )
        .join(autor, models.Resena.usuario_id == autor.id)
        .join(prof, models.Resena.profesional_id == prof.id)
        .filter(models.Resena.comentario.isnot(None))
        .order_by(models.Resena.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comentario": r.comentario,
            "usuario_nombre": usuario_nombre,
            "profesional_nombre": f"{prof_nombre} {prof_apellido}".strip(),
            "profesional_email": prof_email,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r, usuario_nombre, prof_nombre, prof_apellido, prof_email in rows
    ]


@router.get("/check")
def check_resenada(reserva_id: int, db: Session = Depends(get_db)):
    """Indica si una reserva ya fue reseñada."""
    existe = (
        db.query(models.Resena.id)
        .filter(models.Resena.reserva_id == reserva_id)
        .first()
    )
    return {"reserva_id": reserva_id, "ya_resenada": existe is not None}
