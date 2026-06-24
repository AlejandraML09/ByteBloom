from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import SessionLocal
from app import models
from app.routers.usuarios import enviar_mail, FRONTEND_URL
from app.services.cancellation_notifications import (
    notificar_cancelacion_clase,
    notificar_cancelacion_lista_espera,
)


router = APIRouter(prefix="/api", tags=["servicios"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ClaseProgramadaResponse(BaseModel):
    id: int
    zona_id: int
    zona_nombre: str
    sala_id: int
    sala_nombre: str
    profesional_email: Optional[str] = None
    fecha: str
    hora: str
    cupo_maximo: int
    cupo_disponible: int
    precio: float

    class Config:
        from_attributes = True


class ModificarCupoRequest(BaseModel):
    zona_id: int
    fecha: str
    hora: str
    nuevo_cupo: int


class CancelarClaseRequest(BaseModel):
    clase_programada_id: int


def _query_clases_programadas(db: Session, solo_sin_inscritos: bool = False):
    q = (
        db.query(models.ClaseProgramada, models.Zona, models.Sala)
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.Sala, models.ClaseProgramada.sala_id == models.Sala.id)
        .filter(
            models.ClaseProgramada.fecha >= date.today(),
            models.ClaseProgramada.activo == True,
        )
    )
    if solo_sin_inscritos:
        # No registrations yet: cupo_disponible equals cupo_inicial (snapshot)
        q = q.filter(
            models.ClaseProgramada.cupo_disponible == models.ClaseProgramada.cupo_inicial
        )
    return q.order_by(models.ClaseProgramada.fecha, models.ClaseProgramada.hora).all()


def _rows_to_response(rows):
    return [
        ClaseProgramadaResponse(
            id=cp.id,
            zona_id=z.id,
            zona_nombre=z.nombre,
            sala_id=s.id,
            sala_nombre=s.nombre,
            profesional_email=cp.profesional_email,
            fecha=str(cp.fecha),
            hora=str(cp.hora)[:5],  # TIME gives "HH:MM:SS", truncate to "HH:MM"
            cupo_maximo=cp.cupo_inicial,
            cupo_disponible=cp.cupo_disponible,
            precio=float(z.precio),
        )
        for cp, z, s in rows
    ]


@router.get("/clases", response_model=list[ClaseProgramadaResponse])
def obtener_clases(db: Session = Depends(get_db)):
    """Upcoming scheduled classes with availability."""
    return _rows_to_response(_query_clases_programadas(db))


@router.get("/cupos", response_model=list[ClaseProgramadaResponse])
def obtener_clases_para_cupos(db: Session = Depends(get_db)):
    """Upcoming scheduled classes that have no bookings yet."""
    return _rows_to_response(_query_clases_programadas(db, solo_sin_inscritos=True))


@router.post("/cupos")
def modificar_cupo(data: ModificarCupoRequest, db: Session = Depends(get_db)):
    """Update cupo for a scheduled class (only if no bookings yet)."""
    if data.nuevo_cupo <= 0:
        raise HTTPException(status_code=400, detail="El cupo debe ser mayor a 0.")

    cp = (
        db.query(models.ClaseProgramada)
        .filter(
            models.ClaseProgramada.fecha == data.fecha,
            models.ClaseProgramada.hora == data.hora,
            models.ClaseProgramada.zona_id == data.zona_id,
            models.ClaseProgramada.activo == True,
            models.ClaseProgramada.cupo_disponible == models.ClaseProgramada.cupo_inicial,
        )
        .first()
    )

    if not cp:
        raise HTTPException(
            status_code=404,
            detail="No se encontró una clase sin inscriptos para los datos ingresados.",
        )

    cp.cupo_inicial = data.nuevo_cupo
    cp.cupo_disponible = data.nuevo_cupo
    db.commit()

    return {
        "mensaje": "Modificación exitosa",
        "clase_programada_id": cp.id,
        "nuevo_cupo": data.nuevo_cupo,
    }


@router.get("/clases-cancelar", response_model=list[ClaseProgramadaResponse])
def obtener_clases_cancelar(db: Session = Depends(get_db)):
    """Upcoming active scheduled classes available for cancellation."""
    return _rows_to_response(_query_clases_programadas(db))


@router.get("/clases-cancelar/buscar")
def buscar_clase_para_cancelar(
    zona_id: int, fecha: str, hora: str, db: Session = Depends(get_db)
):
    """Busca la clase programada exacta (zona + fecha + hora) que el admin
    quiere cancelar y devuelve cuántos usuarios tienen reserva activa en ella."""
    try:
        fecha_obj = date.fromisoformat(fecha)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Fecha inválida. Usá formato YYYY-MM-DD."
        )

    cp = (
    db.query(models.ClaseProgramada)
    .filter(
        models.ClaseProgramada.zona_id == zona_id,
        models.ClaseProgramada.fecha == fecha_obj,
        models.ClaseProgramada.hora == hora,
        models.ClaseProgramada.activo == True,
    )
    .first()
)
    if not cp:
        raise HTTPException(
            status_code=404,
            detail="No hay clase programada para esa zona, fecha y hora.",
        )

    inscriptos = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.clase_programada_id == cp.id,
            models.Reserva.estado != models.EstadoReserva.cancelada,
        )
        .count()
    )

    lista_espera = (
        db.query(models.ListaEspera)
        .filter(
            models.ListaEspera.clase_programada_id == cp.id,
            models.ListaEspera.activo == True,
            models.ListaEspera.estado.in_(
                [
                    models.EstadoListaEspera.esperando,
                    models.EstadoListaEspera.notificado,
                ]
            ),
        )
        .count()
    )

    return {
        "id": cp.id,
        "activo": cp.activo,
        "inscriptos": inscriptos,
        "lista_espera": lista_espera,
        "zona_id": cp.zona_id,
        "fecha": str(cp.fecha),
        "hora": str(cp.hora)[:5],
    }


@router.post("/clases-cancelar")
def cancelar_clase(data: CancelarClaseRequest, db: Session = Depends(get_db)):
    """Cancela la clase y todas sus reservas activas (los usuarios afectados
    verán el cambio reflejado en 'Mis Reservas')."""
    cp = (
        db.query(models.ClaseProgramada)
        .filter(models.ClaseProgramada.id == data.clase_programada_id)
        .first()
    )

    if not cp:
        raise HTTPException(status_code=404, detail="Clase programada no encontrada.")

    if not cp.activo:
        raise HTTPException(
            status_code=400, detail="La clase ya se encuentra cancelada."
        )

    # Obtener reservas activas para notificar a los usuarios (preservar destinatarios antes del update)
    reservas = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.clase_programada_id == cp.id,
            models.Reserva.estado != models.EstadoReserva.cancelada,
        )
        .all()
    )
    user_ids = [r.usuario_id for r in reservas]

    lista_espera = (
        db.query(models.ListaEspera)
        .filter(
            models.ListaEspera.clase_programada_id == cp.id,
            models.ListaEspera.activo == True,
            models.ListaEspera.estado.in_(
                [
                    models.EstadoListaEspera.esperando,
                    models.EstadoListaEspera.notificado,
                ]
            ),
        )
        .all()
    )
    waitlist_user_ids = [le.usuario_id for le in lista_espera]

    # Marcar reservas y lista de espera como canceladas, y la clase como inactiva
    reservas_canceladas = 0
    if reservas:
        for reserva in reservas:
            medio = db.query(models.MedioPago).filter(models.MedioPago.id == reserva.medio_pago_id).first()
            if medio and medio.nombre != "Efectivo" and reserva.precio_pagado >= reserva.monto_total:
                usuario = db.query(models.Usuario).filter(models.Usuario.id == reserva.usuario_id).first()
                if usuario:
                    usuario.creditos_favor += 1
            reserva.estado = models.EstadoReserva.cancelada
            reservas_canceladas += 1

    for entrada in lista_espera:
        entrada.activo = False
        entrada.estado = models.EstadoListaEspera.cancelado

    cp.activo = False
    db.commit()

    # Enviar notificaciones a los usuarios de reservas activas y de lista de espera
    try:
        notificar_cancelacion_clase(cp.id, db, user_ids=user_ids)
    except Exception:
        # No impedir la operación por fallos en notificaciones
        pass

    try:
        if waitlist_user_ids:
            notificar_cancelacion_lista_espera(cp.id, db, user_ids=waitlist_user_ids)
    except Exception:
        pass

    return {
        "mensaje": "Clase cancelada exitosamente.",
        "clase_programada_id": cp.id,
        "reservas_canceladas": reservas_canceladas,
    }


@router.post("/notificaciones/clase-cancelada")
def notificar_clase_cancelada_endpoint(data: CancelarClaseRequest, db: Session = Depends(get_db)):
    try:
        enviados = notificar_cancelacion_clase(data.clase_programada_id, db)
        return {"enviados": enviados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
