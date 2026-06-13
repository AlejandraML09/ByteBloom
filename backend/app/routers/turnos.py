import uuid
from decimal import Decimal
from datetime import date as date_type, datetime, timedelta
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from app.database import SessionLocal
from app import models

router = APIRouter(tags=["turnos"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def actualizar_reserva_efectivo_vencida(reserva: models.Reserva, now: datetime) -> bool:
    """Marca una reserva en efectivo como cancelada si expiró el plazo de 48 horas."""
    if reserva.estado != models.EstadoReserva.pendiente:
        return False
    if reserva.precio_pagado is None or reserva.monto_total is None:
        return False
    if reserva.precio_pagado < reserva.monto_total:
        fecha_vencimiento = reserva.fecha_reserva + timedelta(hours=48)
        if now > fecha_vencimiento:
            reserva.estado = models.EstadoReserva.cancelada
            return True
    return False


class TurnoItem(BaseModel):
    fecha: str  # "YYYY-MM-DD"
    hora: str   # "HH:MM"


class ReservaRequest(BaseModel):
    zona_id: int
    turnos: list[TurnoItem]
    medio_pago: str
    usuario_id: Optional[int] = None
    tipo_pago: Literal["completo", "sena"] = "completo"


# ── Helpers ───────────────────────────────────────────────────────────────────


def usuario_tiene_ausencia_en_pack_previo(db: Session, usuario_id: Optional[int]) -> bool:
    """True si el usuario tiene al menos una reserva marcada 'ausente'
    perteneciente a un pack (pack_id != NULL). Sirve para decidir si se aplica
    el descuento por pack en su próxima compra."""
    if not usuario_id:
        return False
    row = (
        db.query(models.Reserva.id)
        .filter(
            models.Reserva.usuario_id == usuario_id,
            models.Reserva.pack_id.isnot(None),
            models.Reserva.estado == models.EstadoReserva.ausente,
        )
        .first()
    )
    return row is not None


def calcular_descuento_pct(cantidad: int) -> int:
    """Pack 2 → 10%, pack 3 → 20%, 1 clase → 0%."""
    if cantidad == 2:
        return 10
    if cantidad == 3:
        return 20
    return 0


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/disponibilidad")
def get_disponibilidad(mes: str, db: Session = Depends(get_db)):
    """
    Devuelve las clases programadas del mes con disponibilidad.
    mes: "YYYY-MM"
    """
    try:
        anio, month = mes.split("-")
        anio = int(anio)
        month = int(month)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400, detail="El parámetro 'mes' debe tener formato YYYY-MM."
        )

    rows = (
        db.query(models.ClaseProgramada, models.Zona, models.Sala)
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.Sala, models.ClaseProgramada.sala_id == models.Sala.id)
        .filter(
            models.ClaseProgramada.fecha >= date_type(anio, month, 1),
            models.ClaseProgramada.fecha
            < date_type(anio + (month // 12), (month % 12) + 1, 1),
            models.ClaseProgramada.activo == True,
        )
        .order_by(models.ClaseProgramada.fecha, models.ClaseProgramada.hora)
        .all()
    )

    return [
        {
            "id": cp.id,
            "fecha": str(cp.fecha),
            "hora": str(cp.hora)[:5],
            "cupo_disponible": cp.cupo_disponible,
            "cupo_maximo": cp.cupo_inicial,
            "zona_id": z.id,
            "zona_nombre": z.nombre,
            "sala_id": s.id,
            "sala_nombre": s.nombre,
            "profesional_email": cp.profesional_email,
            "precio": float(z.precio),
        }
        for cp, z, s in rows
    ]


@router.get("/aplica-descuento-pack")
def aplica_descuento_pack(usuario_id: int, db: Session = Depends(get_db)):
    """Indica si el usuario puede recibir descuento por pack o si está penalizado
    por una ausencia previa en otro pack."""
    penalizado = usuario_tiene_ausencia_en_pack_previo(db, usuario_id)
    return {"aplica_descuento": not penalizado, "penalizado_por_ausencia": penalizado}


@router.post("/reservar")
def reservar(data: ReservaRequest, db: Session = Depends(get_db)):
    """
    Reserva uno o más turnos. Calcula descuento por pack (10% / 20%), aplica
    seña si corresponde y agrupa las reservas con un mismo pack_id cuando son
    2 ó 3 turnos.
    """
    zona = db.query(models.Zona).filter(models.Zona.id == data.zona_id).first()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    medio_pago = (
        db.query(models.MedioPago)
        .filter(
            models.MedioPago.nombre == data.medio_pago,
            models.MedioPago.activo == True,
        )
        .first()
    )
    if not medio_pago:
        raise HTTPException(
            status_code=400,
            detail=f"Medio de pago '{data.medio_pago}' no disponible.",
        )

    # Validar todos los slots antes de insertar nada
    clase_programadas = []
    for item in data.turnos:
        try:
            fecha_obj = date_type.fromisoformat(item.fecha)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Fecha inválida: {item.fecha}. Usá formato YYYY-MM-DD.",
            )

        cp = (
            db.query(models.ClaseProgramada)
            .filter(
                models.ClaseProgramada.fecha == fecha_obj,
                models.ClaseProgramada.hora == item.hora,
                models.ClaseProgramada.zona_id == data.zona_id,
                models.ClaseProgramada.activo == True,
            )
            .first()
        )
        if not cp:
            raise HTTPException(
                status_code=404,
                detail=f"No hay clase programada para {item.fecha} a las {item.hora} en la zona seleccionada.",
            )
        if cp.cupo_disponible <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Sin cupos disponibles para {item.fecha} a las {item.hora}.",
            )
        if data.usuario_id is not None:
            existing = (
                db.query(models.Reserva)
                .filter(
                    models.Reserva.usuario_id == data.usuario_id,
                    models.Reserva.clase_programada_id == cp.id,
                    models.Reserva.estado != models.EstadoReserva.cancelada,
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya tenés una reserva activa para el {item.fecha} a las {item.hora}.",
                )
        clase_programadas.append(cp)

    # Cálculo de precio con regla de descuento + penalización
    cantidad = len(clase_programadas)
    descuento_pct = calcular_descuento_pct(cantidad)
    if descuento_pct > 0 and usuario_tiene_ausencia_en_pack_previo(db, data.usuario_id):
        descuento_pct = 0

    precio_unit = Decimal(zona.precio)
    subtotal = precio_unit * cantidad
    monto_total_pack = (subtotal * (100 - descuento_pct) / 100).quantize(Decimal("0.01"))
    # Importe efectivamente cobrado en esta operación
    cobrado_pack = monto_total_pack
    if data.tipo_pago == "sena":
        cobrado_pack = (monto_total_pack / 2).quantize(Decimal("0.01"))
        estado = models.EstadoReserva.pendiente
    elif (medio_pago.nombre == "Efectivo"):
        cobrado_pack = Decimal("0")
        estado = models.EstadoReserva.pendiente
    else:
        estado = models.EstadoReserva.confirmada

    # Repartimos los montos por reserva proporcionalmente al precio_unit
    # (los totales por reserva suman exactamente monto_total_pack / cobrado_pack).
    monto_total_por_reserva = (monto_total_pack / cantidad).quantize(Decimal("0.01"))
    precio_pagado_por_reserva = (cobrado_pack / cantidad).quantize(Decimal("0.01"))

    # pack_id sólo para 2 ó 3 turnos (descuento aplicable)
    pack_id = str(uuid.uuid4()) if cantidad >= 2 else None

    try:
        for cp in clase_programadas:
            db.add(
                models.Reserva(
                    usuario_id=data.usuario_id,
                    clase_programada_id=cp.id,
                    medio_pago_id=medio_pago.id,
                    precio_pagado=precio_pagado_por_reserva,
                    monto_total=monto_total_por_reserva,
                    pack_id=pack_id,
                    estado=estado,
                )
            )
            cp.cupo_disponible -= 1
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya tenés una reserva activa para uno de los horarios seleccionados.",
        )
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo registrar la reserva: {exc}",
        )

    return {
        "ok": True,
        "reservados": len(clase_programadas),
        "descuento_pct": descuento_pct,
        "monto_total": float(monto_total_pack),
        "precio_pagado": float(cobrado_pack),
        "estado": estado.value,
        "tipo_pago": data.tipo_pago,
        "pack_id": pack_id,
    }

@router.get("/mis-turnos")
def get_mis_turnos(usuario_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las reservas del usuario, ordenadas por fecha descendente."""
    now = datetime.now()
    rows = (
        db.query(
            models.Reserva,
            models.ClaseProgramada,
            models.Zona,
            models.MedioPago,
        )
        .join(
            models.ClaseProgramada,
            models.Reserva.clase_programada_id == models.ClaseProgramada.id,
        )
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.MedioPago, models.Reserva.medio_pago_id == models.MedioPago.id)
        .filter(models.Reserva.usuario_id == usuario_id)
        .order_by(
            models.ClaseProgramada.fecha.desc(), models.ClaseProgramada.hora.desc()
        )
        .all()
    )

    # Set de reservas ya reseñadas por el usuario (1 sola query, evita N+1)
    reservas_resenadas = {
        rid
        for (rid,) in db.query(models.Resena.reserva_id).filter(
            models.Resena.usuario_id == usuario_id
        )
    }

    # Nombre del profesional por email (1 sola query batcheada, evita N+1)
    prof_emails = {cp.profesional_email for _, cp, _, _ in rows if cp.profesional_email}
    prof_nombres = {}
    if prof_emails:
        for email, nombre, apellido in db.query(
            models.Usuario.email, models.Usuario.nombre, models.Usuario.apellido
        ).filter(
            models.Usuario.email.in_(prof_emails),
            models.Usuario.rol == models.RolUsuario.profesional,
        ):
            prof_nombres[email] = f"{nombre} {apellido}".strip()

    result = []
    dirty = False
    for r, cp, z, mp in rows:
        # calcular expiración y estado de pago como en la vista administrativa
        elapsed_hours = int((now - r.fecha_reserva).total_seconds() // 3600) if r.fecha_reserva else 0
        if elapsed_hours < 0:
            elapsed_hours = 0
        
        fecha_clase = datetime.combine(cp.fecha, cp.hora)
        fecha_vencimiento = max(r.fecha_reserva + timedelta(hours=48), fecha_clase)
        horas_restantes = max(0, int((fecha_vencimiento - now).total_seconds() // 3600))

        # determinar estado de pago a partir del monto efectivamente pagado
        # (NO del estado de la reserva, para que 'asistio'/'ausente' marcados
        # por el admin sobre una reserva paga sigan mostrando "pago completo").
        pago_cubierto = (
            r.precio_pagado is not None
            and r.monto_total is not None
            and r.precio_pagado >= r.monto_total
        )
        if pago_cubierto:
            payment_status = 'pago_completo'
        elif r.estado == models.EstadoReserva.cancelada  and r.precio_pagado < r.monto_total:
            payment_status = 'vencido'
        else:
            payment_status = 'pago_pendiente'

        # si la reserva está pendiente y venció, marcar como cancelada y vencida
        if r.estado == models.EstadoReserva.pendiente and r.precio_pagado < r.monto_total and now > fecha_clase:
            r.estado = models.EstadoReserva.cancelada
            payment_status = 'vencido'
            dirty = True
            cp.cupo_disponible += 1

        # ── Reseñas ───────────────────────────────────────────────────────
        # Reseñable (regla estricta, igual que POST /reviews): asistencia
        # efectiva ('asistio') + pago completo + la clase tiene profesional
        # asignado + sin reseña previa.
        ya_resenada = r.id in reservas_resenadas
        pago_completo = (
            r.precio_pagado is not None
            and r.monto_total is not None
            and r.precio_pagado >= r.monto_total
        )
        puede_resenar = (
            r.estado == models.EstadoReserva.asistio
            and pago_completo
            and bool(cp.profesional_email)
            and not ya_resenada
        )

        result.append(
            {
                "id": r.id,
                "clase_programada_id": r.clase_programada_id,
                "fecha": str(cp.fecha),
                "hora": str(cp.hora)[:5],
                "zona": z.nombre,
                "medio_pago": mp.nombre,
                "estado": r.estado.value,
                "precio_pagado": float(r.precio_pagado),
                "monto_total": float(r.monto_total) if r.monto_total is not None else None,
                "estado_pago": payment_status,
                "pack_id": r.pack_id,
                "clase_activa": bool(cp.activo),
                "fecha_reserva": r.fecha_reserva.isoformat() if r.fecha_reserva else None,
                "fecha_vencimiento": fecha_vencimiento.isoformat() if fecha_vencimiento else None,
                "horas_restantes": horas_restantes,
                "vencido": horas_restantes == 0,
                "profesional_email": cp.profesional_email,
                "profesional_nombre": prof_nombres.get(cp.profesional_email),
                "ya_resenada": ya_resenada,
                "puede_resenar": puede_resenar,
            }
        )

    if dirty:
        db.commit()
    return result


@router.get("/reservas/efectivo")
def get_reservas_efectivo(db: Session = Depends(get_db)):
    """Devuelve las reservas con pago en efectivo para uso administrativo."""
    from datetime import timedelta
    now = datetime.now()
    rows = (
        db.query(
            models.Reserva,
            models.ClaseProgramada,
            models.Zona,
            models.MedioPago,
            models.Usuario,
        )
        .join(
            models.ClaseProgramada,
            models.Reserva.clase_programada_id == models.ClaseProgramada.id,
        )
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.MedioPago, models.Reserva.medio_pago_id == models.MedioPago.id)
        .join(models.Usuario, models.Reserva.usuario_id == models.Usuario.id)
        .filter(models.MedioPago.nombre == 'Efectivo')
        .order_by(models.Reserva.fecha_reserva.desc())
        .all()
    )

    result = []
    dirty = False
    for reserva, cp, zona, mp, usuario in rows:
        elapsed_hours = int((now - reserva.fecha_reserva).total_seconds() // 3600)
        if elapsed_hours < 0:
            elapsed_hours = 0
        fecha_clase = datetime.combine(cp.fecha, cp.hora)
        fecha_vencimiento = max(reserva.fecha_reserva + timedelta(hours=48), fecha_clase)
        if reserva.precio_pagado >= reserva.monto_total:
          horas_restantes = 0
        else:
          horas_restantes = max(0, int((fecha_vencimiento - now).total_seconds() // 3600))
        payment_status = 'pago_completo'

        if reserva.estado == models.EstadoReserva.confirmada:
            payment_status = 'pago_completo'
        elif reserva.estado == models.EstadoReserva.cancelada  and reserva.precio_pagado < reserva.monto_total:
            payment_status = 'vencido'
        else:
            payment_status = 'pago_pendiente'

        if reserva.estado == models.EstadoReserva.pendiente and reserva.precio_pagado < reserva.monto_total and now > fecha_clase:
            reserva.estado = models.EstadoReserva.cancelada
            payment_status = 'vencido'
            dirty = True
            cp.cupo_disponible += 1

        result.append(
            {
                "id": reserva.id,
                "usuario_id": usuario.id,
                "cliente": f"{usuario.nombre} {usuario.apellido}",
                "email": usuario.email,
                "fecha": str(cp.fecha),
                "hora": str(cp.hora)[:5],
                "zona": zona.nombre,
                "medio_pago": mp.nombre,
                "estado": reserva.estado.value,
                "precio_pagado": float(reserva.precio_pagado),
                "monto_total": float(reserva.monto_total) if reserva.monto_total is not None else None,
                "estado_pago": payment_status,
                "fecha_reserva": reserva.fecha_reserva.isoformat() if reserva.fecha_reserva else None,
                "fecha_vencimiento": fecha_vencimiento.isoformat(),
                "horas_restantes": horas_restantes,
                "vencido": horas_restantes == 0,
                "clase_activa": bool(cp.activo),
            }

        )

    if dirty:
        db.commit()
    return result


@router.post("/reservas/{reserva_id}/completar-pago")
def completar_pago(reserva_id: int, db: Session = Depends(get_db)):
    """Marca la reserva como pago completo (precio_pagado := monto_total) y
    cambia su estado a 'confirmada' para indicar que fue recibido.
    En un flujo real con MercadoPago, este endpoint debería dispararse desde el
    callback exitoso de la pasarela tras cobrar el saldo. Acá lo simplificamos
    para que el front pueda completar el pago directamente."""
    reserva = (
        db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")
    if reserva.precio_pagado >= reserva.monto_total:
        raise HTTPException(
            status_code=400, detail="La reserva ya tiene el pago completo."
        )
    saldo = Decimal(reserva.monto_total) - Decimal(reserva.precio_pagado)
    reserva.precio_pagado = reserva.monto_total
    reserva.estado = models.EstadoReserva.confirmada
    db.commit()
    return {
        "ok": True,
        "reserva_id": reserva.id,
        "saldo_cobrado": float(saldo),
        "estado_pago": reserva.estado_pago,
        "estado_reserva": reserva.estado.value,
    }


@router.post("/reservas/{reserva_id}/confirmar-pago-efectivo")
def confirmar_pago_efectivo(reserva_id: int, db: Session = Depends(get_db)):
    """Confirma un pago en efectivo: cambia el estado de la reserva a 'confirmada'.
    Este endpoint es específico para pagos en efectivo y NO valida el monto,
    ya que en efectivo precio_pagado siempre es igual a monto_total desde el inicio."""
    reserva = (
        db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")
    
    # Cambiar estado a confirmada
    reserva.precio_pagado = reserva.monto_total  # ← agregar
    reserva.estado = models.EstadoReserva.confirmada
    db.commit()
    
    return {
        "ok": True,
        "reserva_id": reserva.id,
        "estado_reserva": reserva.estado.value,
    }


class RegistrarPagoSaldoRequest(BaseModel):
    medio_pago: str


@router.post("/reservas/{reserva_id}/registrar-pago-saldo")
def registrar_pago_saldo(
    reserva_id: int,
    data: RegistrarPagoSaldoRequest,
    db: Session = Depends(get_db),
):
    """
    Registra cómo se pagará el saldo restante (efectivo/transferencia),
    pero NO marca la reserva como pagada todavía.
    Reinicia el contador de 48 hs desde el momento actual.
    """

    reserva = (
        db.query(models.Reserva)
        .filter(models.Reserva.id == reserva_id)
        .first()
    )

    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    if reserva.precio_pagado >= reserva.monto_total:
        raise HTTPException(
            status_code=400,
            detail="La reserva ya tiene el pago completo.",
        )

    medio_pago = (
        db.query(models.MedioPago)
        .filter(
            models.MedioPago.nombre == data.medio_pago,
            models.MedioPago.activo == True,
        )
        .first()
    )

    if not medio_pago:
        raise HTTPException(
            status_code=400,
            detail=f"Medio de pago '{data.medio_pago}' no disponible.",
        )

    # actualizar método de pago
    reserva.medio_pago_id = medio_pago.id

    # dejar pendiente (NO confirmada)
    reserva.estado = models.EstadoReserva.pendiente

    # reiniciar ventana de 48 hs
    reserva.fecha_reserva = datetime.now()

    db.commit()

    return {
        "ok": True,
        "reserva_id": reserva.id,
        "medio_pago": medio_pago.nombre,
        "estado_reserva": reserva.estado.value,
    }


# ── Asistencia (admin / secretario) ───────────────────────────────────────────

# Estados de asistencia editables desde el panel. "pendiente" = aún no se tomó.
ESTADOS_ASISTENCIA = {
    "pendiente": models.EstadoReserva.pendiente,
    "asistio": models.EstadoReserva.asistio,
    "ausente": models.EstadoReserva.ausente,
}


def _mapear_estado_asistencia(estado: models.EstadoReserva) -> str:
    """Estado de la reserva → valor que muestra el dropdown de asistencia.
    'confirmada'/'pendiente' (aún no se tomó asistencia) se muestran como 'pendiente'."""
    if estado == models.EstadoReserva.asistio:
        return "asistio"
    if estado == models.EstadoReserva.ausente:
        return "ausente"
    return "pendiente"


@router.get("/asistencia")
def get_asistencia(fecha: str, hora: str, db: Session = Depends(get_db)):
    """Reservas reales de un slot (fecha + hora) para tomar asistencia.
    Excluye canceladas. Una sola query con los JOINs necesarios."""
    try:
        fecha_obj = date_type.fromisoformat(fecha)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Fecha inválida. Usá formato YYYY-MM-DD."
        )

    rows = (
        db.query(models.Reserva, models.ClaseProgramada, models.Zona, models.Usuario)
        .join(
            models.ClaseProgramada,
            models.Reserva.clase_programada_id == models.ClaseProgramada.id,
        )
        .join(models.Zona, models.ClaseProgramada.zona_id == models.Zona.id)
        .join(models.Usuario, models.Reserva.usuario_id == models.Usuario.id)
        .filter(
            models.ClaseProgramada.fecha == fecha_obj,
            models.ClaseProgramada.hora == hora[:5],
            models.Reserva.estado != models.EstadoReserva.cancelada,
        )
        .order_by(models.Zona.nombre, models.Usuario.apellido)
        .all()
    )

    return [
        {
            "reserva_id": r.id,
            "usuario_id": u.id,
            "paciente": f"{u.nombre} {u.apellido}",
            "zona": z.nombre,
            "estado": r.estado.value,
            "asistencia": _mapear_estado_asistencia(r.estado),
        }
        for r, cp, z, u in rows
    ]


class ActualizarAsistenciaRequest(BaseModel):
    estado: Literal["pendiente", "asistio", "ausente"]
    actor_id: int


@router.put("/reservas/{reserva_id}/asistencia")
def actualizar_asistencia(
    reserva_id: int,
    data: ActualizarAsistenciaRequest,
    db: Session = Depends(get_db),
):
    """Actualiza el estado de asistencia de una reserva. Solo admin/secretario."""
    actor = (
        db.query(models.Usuario).filter(models.Usuario.id == data.actor_id).first()
    )
    if not actor or actor.rol not in (
        models.RolUsuario.admin,
        models.RolUsuario.secretario,
    ):
        raise HTTPException(
            status_code=403,
            detail="No tenés permisos para registrar asistencia.",
        )

    reserva = (
        db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    if reserva.estado == models.EstadoReserva.cancelada:
        raise HTTPException(
            status_code=400,
            detail="No se puede tomar asistencia de una reserva cancelada.",
        )

    reserva.estado = ESTADOS_ASISTENCIA[data.estado]
    db.commit()

    return {
        "ok": True,
        "reserva_id": reserva.id,
        "estado": reserva.estado.value,
        "asistencia": _mapear_estado_asistencia(reserva.estado),
    }



@router.post("/reservas/{reserva_id}/cancelar")
def cancelar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """
    Cancela una reserva. Reglas:
    - Siempre libera el cupo.
    - Si cancela con más de 48hs de anticipación a la clase:
        - Pago completo → se registra devolución de dinero
        - Seña (precio_pagado < monto_total) → se devuelve la seña
    - Si cancela con menos de 48hs:
        - Seña → se pierde (sin devolución)
        - Pago completo → devolución de dinero igual
    """
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    if reserva.estado == models.EstadoReserva.cancelada:
        raise HTTPException(status_code=400, detail="La reserva ya está cancelada.")

    cp = db.query(models.ClaseProgramada).filter(
        models.ClaseProgramada.id == reserva.clase_programada_id
    ).first()

    now = datetime.now()
    fecha_clase = datetime.combine(cp.fecha, cp.hora)
    horas_hasta_clase = (fecha_clase - now).total_seconds() / 3600
    con_anticipacion = horas_hasta_clase >= 48

    pago_completo = (
        reserva.precio_pagado is not None
        and reserva.monto_total is not None
        and reserva.precio_pagado >= reserva.monto_total
    )
    tiene_sena = (
        reserva.precio_pagado is not None
        and reserva.monto_total is not None
        and Decimal(str(reserva.precio_pagado)) > 0
        and Decimal(str(reserva.precio_pagado)) < Decimal(str(reserva.monto_total))
    )

    # Determinar resultado de devolución
    if pago_completo:
        devolucion = float(reserva.precio_pagado)
        tipo_devolucion = "dinero"
    elif con_anticipacion and tiene_sena:
        devolucion = float(reserva.precio_pagado)
        tipo_devolucion = "dinero"
    else:
        # sin anticipación + seña, o sin pago → sin devolución
        devolucion = 0.0
        tipo_devolucion = "ninguna"

    # Cancelar y liberar cupo
    reserva.estado = models.EstadoReserva.cancelada
    cp.cupo_disponible += 1

    db.commit()

    return {
        "ok": True,
        "reserva_id": reserva.id,
        "devolucion": devolucion,
        "tipo_devolucion": tipo_devolucion,
        "con_anticipacion": con_anticipacion,
        "horas_hasta_clase": round(horas_hasta_clase, 1),
    }