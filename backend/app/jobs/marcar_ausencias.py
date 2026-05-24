"""Job: marca reservas como 'ausente' si pasaron más de N horas desde la clase
y nadie las marcó como 'asistio'.

Se invoca:
  - periódicamente desde un loop async iniciado en main.py
  - manualmente vía endpoint admin (opcional, no implementado acá)
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models


logger = logging.getLogger(__name__)

# Tiempo de gracia tras el horario de la clase antes de marcar 'ausente'.
HORAS_GRACIA = 2

# Cada cuánto reanaliza el sistema. 30 minutos es suficiente para que ninguna
# reserva quede sin marcar más de 30' después de cumplido el plazo.
INTERVALO_SEGUNDOS = 30 * 60


def marcar_ausencias_pendientes(db: Session) -> int:
    """Marca como 'ausente' las reservas cuya clase ya pasó hace más de
    HORAS_GRACIA y que siguen en estado pendiente/confirmada."""
    ahora = datetime.now()
    limite = ahora - timedelta(hours=HORAS_GRACIA)

    candidatas = (
        db.query(models.Reserva, models.ClaseProgramada)
        .join(
            models.ClaseProgramada,
            models.Reserva.clase_programada_id == models.ClaseProgramada.id,
        )
        .filter(
            models.Reserva.estado.in_(
                [models.EstadoReserva.pendiente, models.EstadoReserva.confirmada]
            )
        )
        .all()
    )

    marcadas = 0
    for reserva, cp in candidatas:
        fecha_hora_clase = datetime.combine(cp.fecha, cp.hora)
        if fecha_hora_clase <= limite:
            reserva.estado = models.EstadoReserva.ausente
            marcadas += 1

    if marcadas:
        db.commit()
        logger.info("marcar_ausencias_pendientes: %d reservas pasadas a 'ausente'", marcadas)
    return marcadas


async def loop_marcar_ausencias() -> None:
    """Loop infinito que corre `marcar_ausencias_pendientes` cada
    INTERVALO_SEGUNDOS. Se inicia en main.py al startup."""
    while True:
        try:
            db = SessionLocal()
            try:
                marcar_ausencias_pendientes(db)
            finally:
                db.close()
        except Exception:  # noqa: BLE001
            logger.exception("Error ejecutando marcar_ausencias_pendientes")
        await asyncio.sleep(INTERVALO_SEGUNDOS)
