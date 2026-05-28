import asyncio
import logging
from datetime import datetime, timedelta

from app.database import SessionLocal
from app import models

logger = logging.getLogger(__name__)


def liberar_reservas_vencidas() -> None:
    db = SessionLocal()
    try:
        now = datetime.now()
        reservas_vencidas = (
            db.query(models.Reserva, models.ClaseProgramada)
.join(models.MedioPago, models.Reserva.medio_pago_id == models.MedioPago.id)
.join(models.ClaseProgramada, models.Reserva.clase_programada_id == models.ClaseProgramada.id)
            .filter(
                models.Reserva.estado == models.EstadoReserva.pendiente,
                models.MedioPago.nombre == "Efectivo",
            )
            .all()
        )
        liberadas = 0
        for reserva, clase in reservas_vencidas:
            if reserva.fecha_reserva is None:
                continue
            fecha_clase = datetime.combine(clase.fecha, clase.hora)
            fecha_vencimiento = min(reserva.fecha_reserva + timedelta(hours=48), fecha_clase)
            if now > fecha_vencimiento:
                reserva.estado = models.EstadoReserva.cancelada
                clase.cupo_disponible += 1
                liberadas += 1
                logger.info(f"Reserva {reserva.id} cancelada. Cupo devuelto a clase {reserva.clase_programada_id}.")
        if liberadas > 0:
            db.commit()
            logger.info(f"Job completado: {liberadas} reserva(s) liberada(s).")
    except Exception as e:
        db.rollback()
        logger.error(f"Error en job liberar_reservas_vencidas: {e}")
    finally:
        db.close()


async def loop_liberar_vencidas() -> None:
    while True:
        try:
            liberar_reservas_vencidas()
        except Exception:
            logger.exception("Error en loop_liberar_vencidas")
        await asyncio.sleep(1 * 60)