"""seed clases_programadas mayo y junio 2026

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a1b2c3
Create Date: 2026-05-19 17:00:00.000000

"""

from datetime import date, timedelta
from typing import Sequence, Union

from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a1b2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# isoweekday: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
SCHEDULE = [
    ("marcela.rios@endereza2.com", {1, 3, 5}, "07:00:00"),  # superior · L/M/V mañana
    (
        "carolina.fuentes@endereza2.com",
        {2, 4, 6},
        "09:00:00",
    ),  # superior · M/J/S mañana
    ("andrea.salinas@endereza2.com", {1, 3, 5}, "10:00:00"),  # medio    · L/M/V mañana
    ("lucas.bertoldi@endereza2.com", {2, 4, 6}, "08:00:00"),  # medio    · M/J/S mañana
    ("julian.pedraza@endereza2.com", {1, 3, 5}, "17:00:00"),  # inferior · L/M/V tarde
    ("emilio.manrique@endereza2.com", {2, 4, 6}, "19:00:00"),  # inferior · M/J/S noche
]

START = date(2026, 5, 1)
END = date(2026, 6, 30)


def _dates_for(weekdays: set) -> list[str]:
    result = []
    current = START
    while current <= END:
        if current.isoweekday() in weekdays:
            result.append(str(current))
        current += timedelta(days=1)
    return result


def upgrade():
    for email, weekdays, time_str in SCHEDULE:
        dates = _dates_for(weekdays)
        values = ", ".join(f"('{d}'::date)" for d in dates)
        op.execute(f"""
        INSERT INTO clases_programadas (clase_id, fecha, hora, cupo_disponible)
        SELECT c.id, d.fecha, '{time_str}'::time, c.cupo_maximo
        FROM clases c
        CROSS JOIN (VALUES {values}) AS d(fecha)
        WHERE c.profesional_email = '{email}'
          AND c.activo = true
          AND NOT EXISTS (
              SELECT 1 FROM clases_programadas cp
              WHERE cp.clase_id = c.id
                AND cp.fecha = d.fecha
                AND cp.hora = '{time_str}'::time
          );
        """)


def downgrade():
    # EXTRACT(DOW): 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    op.execute("""
    DELETE FROM clases_programadas cp
    USING clases c
    WHERE cp.clase_id = c.id
      AND cp.fecha BETWEEN '2026-05-01' AND '2026-06-30'
      AND (
          (c.profesional_email = 'marcela.rios@endereza2.com'      AND cp.hora = '07:00:00' AND EXTRACT(DOW FROM cp.fecha) IN (1, 3, 5)) OR
          (c.profesional_email = 'carolina.fuentes@endereza2.com'  AND cp.hora = '09:00:00' AND EXTRACT(DOW FROM cp.fecha) IN (2, 4, 6)) OR
          (c.profesional_email = 'andrea.salinas@endereza2.com'    AND cp.hora = '10:00:00' AND EXTRACT(DOW FROM cp.fecha) IN (1, 3, 5)) OR
          (c.profesional_email = 'lucas.bertoldi@endereza2.com'    AND cp.hora = '08:00:00' AND EXTRACT(DOW FROM cp.fecha) IN (2, 4, 6)) OR
          (c.profesional_email = 'julian.pedraza@endereza2.com'    AND cp.hora = '17:00:00' AND EXTRACT(DOW FROM cp.fecha) IN (1, 3, 5)) OR
          (c.profesional_email = 'emilio.manrique@endereza2.com'   AND cp.hora = '19:00:00' AND EXTRACT(DOW FROM cp.fecha) IN (2, 4, 6))
      );
    """)
