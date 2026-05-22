"""seed_clases_programadas: extiende originales a julio y agrega horarios 09:00-17:00

Revision ID: c1d2e3f4a5b6
Revises: b9e1f2a3c4d5
Create Date: 2026-05-21 00:00:00.000000

Cambios:
  1. Extiende las 6 clases originales (que llegaban hasta 30/06) hasta 31/07
     con sus mismos días y horarios originales.
  2. Agrega horarios 09:00-17:00 (cada hora, L-V) para todas las clases activas
     desde 2026-05-22 hasta 2026-07-31, saltando horarios ya existentes.
"""
from datetime import date, timedelta
from typing import Sequence, Union
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b9e1f2a3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

START_NEW = date(2026, 5, 22)
START_EXT = date(2026, 7, 1)
END       = date(2026, 7, 31)

# Originales: días y horario fijo para extensión hasta julio
ORIGINALES = [
    ("marcela.rios@endereza2.com",     8,  {1, 3, 5}, "07:00"),
    ("carolina.fuentes@endereza2.com", 8,  {2, 4, 5}, "09:00"),
    ("andrea.salinas@endereza2.com",   8,  {1, 3, 5}, "10:00"),
    ("lucas.bertoldi@endereza2.com",   8,  {2, 4, 5}, "08:00"),
    ("julian.pedraza@endereza2.com",   10, {1, 3, 5}, "17:00"),
    ("emilio.manrique@endereza2.com",  10, {2, 4, 5}, "19:00"),
]

# Todas las clases activas con zona, cupo y horarios a excluir (ya existentes)
CLASES = [
    ("marcela.rios@endereza2.com",     "superior", 8,  {"07:00"}),
    ("carolina.fuentes@endereza2.com", "superior", 8,  {"09:00"}),
    ("marcela.rios@endereza2.com",     "superior", 5,  {"08:00", "12:00"}),
    ("lucas.bertoldi@endereza2.com",   "superior", 6,  {"11:00", "15:00"}),
    ("andrea.salinas@endereza2.com",   "medio",    8,  {"10:00"}),
    ("lucas.bertoldi@endereza2.com",   "medio",    8,  {"08:00"}),
    ("julian.pedraza@endereza2.com",   "medio",    7,  {"10:00"}),
    ("carolina.fuentes@endereza2.com", "medio",    6,  {"13:00", "16:00"}),
    ("julian.pedraza@endereza2.com",   "inferior", 10, {"17:00"}),
    ("emilio.manrique@endereza2.com",  "inferior", 10, {"19:00"}),
    ("andrea.salinas@endereza2.com",   "inferior", 8,  {"14:00"}),
    ("emilio.manrique@endereza2.com",  "inferior", 5,  {"09:00"}),
]

HORARIOS_NUEVOS = [f"{h:02d}:00" for h in range(9, 18)]


def _dates_for(start, end, dias):
    result = []
    current = start
    while current <= end:
        if current.isoweekday() in dias:
            result.append(str(current))
        current += timedelta(days=1)
    return result


def upgrade():

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

    # ── 2. Nuevos horarios 09:00-17:00 para todas las clases activas ──────────
    fechas_lv = _dates_for(START_NEW, END, {1, 2, 3, 4, 5})
    values_lv = ", ".join(f"('{d}'::date)" for d in fechas_lv)

    for email, zona, cupo, excluir in CLASES:
        horarios = [h for h in HORARIOS_NUEVOS if h not in excluir]
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
    # Borra todas las clases programadas de las clases activas
    # desde 2026-05-22 en adelante que tengan horarios 09:00-17:00
    # y la extensión de julio de las originales

    prof_emails = ", ".join(f"'{e}'" for e in [
        'marcela.rios@endereza2.com',
        'carolina.fuentes@endereza2.com',
        'andrea.salinas@endereza2.com',
        'lucas.bertoldi@endereza2.com',
        'julian.pedraza@endereza2.com',
        'emilio.manrique@endereza2.com',
    ])

    op.execute(f"""
    -- Eliminar extensión julio de originales
    DELETE FROM clases_programadas cp
    USING clases c
    WHERE cp.clase_id = c.id
      AND c.profesional_email IN ({prof_emails})
      AND cp.fecha BETWEEN '2026-07-01' AND '2026-07-31';

    -- Eliminar horarios 09:00-17:00 agregados desde 22/05
    DELETE FROM clases_programadas cp
    USING clases c
    WHERE cp.clase_id = c.id
      AND c.profesional_email IN ({prof_emails})
      AND cp.fecha BETWEEN '2026-05-22' AND '2026-06-30'
      AND cp.hora BETWEEN '09:00'::time AND '17:00'::time
      AND cp.hora NOT IN ('07:00'::time, '08:00'::time,
                          '10:00'::time, '12:00'::time,
                          '13:00'::time, '14:00'::time,
                          '15:00'::time, '16:00'::time,
                          '17:00'::time, '19:00'::time);
    """)