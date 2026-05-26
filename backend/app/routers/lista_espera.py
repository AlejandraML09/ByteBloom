from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import SessionLocal
from app import models

router = APIRouter(tags=["lista_espera"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ListaEsperaRequest(BaseModel):
    usuario_id: int
    clase_programada_id: int


@router.post("/lista-espera")
def unirse_lista_espera(data: ListaEsperaRequest, db: Session = Depends(get_db)):
    cp = (
        db.query(models.ClaseProgramada)
        .filter(
            models.ClaseProgramada.id == data.clase_programada_id,
            models.ClaseProgramada.activo == True,
        )
        .first()
    )
    if not cp:
        raise HTTPException(status_code=404, detail="Clase programada no encontrada.")
    if cp.cupo_disponible > 0:
        raise HTTPException(
            status_code=400,
            detail="La clase todavía tiene cupos disponibles. Podés reservar directamente.",
        )

    existing = (
        db.query(models.ListaEspera)
        .filter(
            models.ListaEspera.usuario_id == data.usuario_id,
            models.ListaEspera.clase_programada_id == data.clase_programada_id,
            models.ListaEspera.activo == True,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Ya estás en la lista de espera para esta clase."
        )

    max_prioridad = (
        db.query(func.max(models.ListaEspera.prioridad))
        .filter(
            models.ListaEspera.clase_programada_id == data.clase_programada_id,
            models.ListaEspera.activo == True,
        )
        .scalar()
    )
    nueva_prioridad = (max_prioridad or 0) + 1

    entrada = models.ListaEspera(
        usuario_id=data.usuario_id,
        clase_programada_id=data.clase_programada_id,
        prioridad=nueva_prioridad,
    )
    db.add(entrada)
    db.commit()
    db.refresh(entrada)
    return {"ok": True, "id": entrada.id, "prioridad": nueva_prioridad}


@router.delete("/lista-espera/{clase_programada_id}")
def salir_lista_espera(
    clase_programada_id: int, usuario_id: int, db: Session = Depends(get_db)
):
    entrada = (
        db.query(models.ListaEspera)
        .filter(
            models.ListaEspera.usuario_id == usuario_id,
            models.ListaEspera.clase_programada_id == clase_programada_id,
            models.ListaEspera.activo == True,
        )
        .first()
    )
    if not entrada:
        raise HTTPException(
            status_code=404, detail="No estás en la lista de espera para esta clase."
        )
    db.delete(entrada)
    db.commit()
    return {"ok": True}


@router.get("/mi-lista-espera")
def get_mi_lista_espera(usuario_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(models.ListaEspera, models.ClaseProgramada, models.Zona)
        .join(
            models.ClaseProgramada,
            models.ListaEspera.clase_programada_id == models.ClaseProgramada.id,
        )
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .filter(
            models.ListaEspera.usuario_id == usuario_id,
            models.ListaEspera.activo == True,
            models.ListaEspera.estado == models.EstadoListaEspera.esperando,
            models.ClaseProgramada.activo == True,
        )
        .order_by(models.ClaseProgramada.fecha, models.ClaseProgramada.hora)
        .all()
    )
    return [
        {
            "id": le.id,
            "clase_programada_id": cp.id,
            "fecha": str(cp.fecha),
            "hora": str(cp.hora)[:5],
            "zona_nombre": z.nombre,
            "fecha_inscripcion": (
                le.fecha_inscripcion.isoformat() if le.fecha_inscripcion else None
            ),
            "prioridad": le.prioridad,
        }
        for le, cp, z in rows
    ]
