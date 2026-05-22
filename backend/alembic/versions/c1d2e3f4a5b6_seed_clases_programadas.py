"""seed_clases_programadas: una clase por hora por zona, 08:00-19:00, L-V

Revision ID: c1d2e3f4a5b6
Revises: b9e1f2a3c4d5
Create Date: 2026-05-22 00:00:00.000000

Primero limpia lo insertado por migraciones anteriores en el rango 22/05-31/07
para clases programadas de las 12 clases activas, luego re-inserta correctamente
con una sola clase por hora por zona.

También extiende las 6 clases originales (llegaban hasta 30/06) hasta 31/07
con sus horarios originales, respetando la regla de una por hora por zona.

Distribución final (08:00-19:00, una por zona por hora):
  Superior:
    Marcela  cupo=8  → 08:00, 12:00, 16:00
    Carolina cupo=8  → 09:00, 13:00, 17:00
    Marcela  cupo=5  → 10:00, 14:00, 18:00
    Lucas    cupo=6  → 11:00, 15:00, 19:00
  Medio:
    Andrea   cupo=8  → 08:00, 12:00, 16:00
    Lucas    cupo=8  → 09:00, 13:00, 17:00
    Julian   cupo=7  → 10:00, 14:00, 18:00
    Carolina cupo=6  → 11:00, 15:00, 19:00
  Inferior:
    Julian   cupo=10 → 08:00, 12:00, 16:00
    Emilio   cupo=10 → 09:00, 13:00, 17:00
    Andrea   cupo=8  → 10:00, 14:00, 18:00
    Emilio   cupo=5  → 11:00, 15:00, 19:00
"""
from datetime import date, timedelta
from typing import Sequence, Union
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b9e1f2a3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

START = date(2026, 5, 22)
END   = date(2026, 7, 31)
START_EXT = date(2026, 7, 1)  # extensión de originales

# Originales: días específicos y horario fijo (extensión julio)
ORIGINALES = [
    ("marcela.rios@endereza2.com",     8,  {1, 3, 5}, "07:00"),
    ("carolina.fuentes@endereza2.com", 8,  {2, 4, 5}, "09:00"),
    ("andrea.salinas@endereza2.com",   8,  {1, 3, 5}, "10:00"),
    ("lucas.bertoldi@endereza2.com",   8,  {2, 4, 5}, "08:00"),
    ("julian.pedraza@endereza2.com",   10, {1, 3, 5}, "17:00"),
    ("emilio.manrique@endereza2.com",  10, {2, 4, 5}, "19:00"),
]

# Distribución nueva: una clase por hora por zona
DISTRIBUCION = [
    # Superior
    ("marcela.rios@endereza2.com",     "superior", 8,  ["08:00", "12:00", "16:00"]),
    ("carolina.fuentes@endereza2.com", "superior", 8,  ["09:00", "13:00", "17:00"]),
    ("marcela.rios@endereza2.com",     "superior", 5,  ["10:00", "14:00", "18:00"]),
    ("lucas.bertoldi@endereza2.com",   "superior", 6,  ["11:00", "15:00", "19:00"]),
    # Medio
    ("andrea.salinas@endereza2.com",   "medio",    8,  ["08:00", "12:00", "16:00"]),
    ("lucas.bertoldi@endereza2.com",   "medio",    8,  ["09:00", "13:00", "17:00"]),
    ("julian.pedraza@endereza2.com",   "medio",    7,  ["10:00", "14:00", "18:00"]),
    ("carolina.fuentes@endereza2.com", "medio",    6,  ["11:00", "15:00", "19:00"]),
    # Inferior
    ("julian.pedraza@endereza2.com",   "inferior", 10, ["08:00", "12:00", "16:00"]),
    ("emilio.manrique@endereza2.com",  "inferior", 10, ["09:00", "13:00", "17:00"]),
    ("andrea.salinas@endereza2.com",   "inferior", 8,  ["10:00", "14:00", "18:00"]),
    ("emilio.manrique@endereza2.com",  "inferior", 5,  ["11:00", "15:00", "19:00"]),
]

PROF_EMAILS = (
    "'marcela.rios@endereza2.com'",
    "'carolina.fuentes@endereza2.com'",
    "'andrea.salinas@endereza2.com'",
    "'lucas.bertoldi@endereza2.com'",
    "'julian.pedraza@endereza2.com'",
    "'emilio.manrique@endereza2.com'",
)


def _dates_for(start, end, dias):
    result = []
    current = start
    while current <= end:
        if current.isoweekday() in dias:
            result.append(str(current))
        current += timedelta(days=1)
    return result


def upgrade():

    # ── 0. Limpiar clases programadas anteriores en el rango 22/05-31/07 ──────
    # Preserva las reservas y abonos ya creados (el seed_grande usó fechas de
    # junio con horarios específicos que no pisamos aquí, pero por seguridad
    # solo borramos filas sin reservas activas asociadas)
    op.execute(f"""
    DELETE FROM clases_programadas cp
    USING clases c
    WHERE cp.clase_id = c.id
      AND c.profesional_email IN ({", ".join(PROF_EMAILS)})
      AND cp.fecha BETWEEN '2026-05-22' AND '2026-07-31'
      AND cp.hora BETWEEN '07:00'::time AND '19:00'::time
      AND NOT EXISTS (
          SELECT 1 FROM reservas r
          WHERE r.clase_programada_id = cp.id
            AND r.estado NOT IN ('cancelada'::estado_reserva)
      )
      AND NOT EXISTS (
          SELECT 1 FROM lista_espera le
          WHERE le.clase_programada_id = cp.id
            AND le.activo = true
      );
    """)

    # ── 1. Extender originales hasta 31 de julio ───────────────────────────────
    for email, cupo, dias, hora in ORIGINALES:
        fechas = _dates_for(START_EXT, END, dias)
        values = ", ".join(f"('{d}'::date)" for d in fechas)
        op.execute(f"""
        INSERT INTO clases_programadas (clase_id, fecha, hora, cupo_disponible)
        SELECT c.id, d.fecha, '{hora}'::time, c.cupo_maximo
        FROM clases c
        CROSS JOIN (VALUES {values}) AS d(fecha)
        WHERE c.profesional_email = '{email}'
          AND c.cupo_maximo = {cupo}
          AND c.activo = true
          AND NOT EXISTS (
              SELECT 1 FROM clases_programadas cp
              WHERE cp.clase_id = c.id
                AND cp.fecha = d.fecha
                AND cp.hora = '{hora}'::time
          );
        """)

    # ── 2. Insertar distribución nueva (una por hora por zona) ────────────────
    fechas_lv = _dates_for(START, END, {1, 2, 3, 4, 5})
    values_lv = ", ".join(f"('{d}'::date)" for d in fechas_lv)

    for email, zona, cupo, horarios in DISTRIBUCION:
        for hora in horarios:
            op.execute(f"""
            INSERT INTO clases_programadas (clase_id, fecha, hora, cupo_disponible)
            SELECT c.id, d.fecha, '{hora}'::time, c.cupo_maximo
            FROM clases c
            JOIN zonas z ON z.id = c.zona_id AND z.nombre = '{zona}'
            CROSS JOIN (VALUES {values_lv}) AS d(fecha)
            WHERE c.profesional_email = '{email}'
              AND c.cupo_maximo = {cupo}
              AND c.activo = true
              AND NOT EXISTS (
                  SELECT 1 FROM clases_programadas cp
                  WHERE cp.clase_id = c.id
                    AND cp.fecha = d.fecha
                    AND cp.hora = '{hora}'::time
              );
            """)


def downgrade():
    op.execute(f"""
    -- Eliminar todo lo generado en este seed
    DELETE FROM clases_programadas cp
    USING clases c
    WHERE cp.clase_id = c.id
      AND c.profesional_email IN ({", ".join(PROF_EMAILS)})
      AND cp.fecha BETWEEN '2026-05-22' AND '2026-07-31'
      AND NOT EXISTS (
          SELECT 1 FROM reservas r
          WHERE r.clase_programada_id = cp.id
            AND r.estado NOT IN ('cancelada'::estado_reserva)
      );
    """)