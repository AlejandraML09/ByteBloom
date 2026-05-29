"""nuevos turnos 29-05 post-14h, extension junio, cupos a 30 y limpieza Romina

Revision ID: d9e0f1a2b3c4
Revises: c7d8e9f0a1b2
Create Date: 2026-05-28 00:00:00.000000

Cambios:
  1. Elimina reservas, abonos y pagos de Romina Ortega.
     NO toca su lista_espera (queda en espera para Andrea Central 2/6 14:00).
     Orden de borrado respeta FK:
       abono_reservas -> pagos_abono -> reservas -> abonos

  2. Agrega 8 slots nuevos el 2026-05-29 (viernes) post-14:00, en los huecos
     libres de cada sala sin conflicto de sala ni de profesional.

  3. Extiende esos mismos 8 slots L-V durante todo junio (2026-06-01 a 2026-06-30).

  4. Actualiza cupo_inicial = 30 y recalcula cupo_disponible en TODAS las clases
     EXCEPTO Andrea Central 2026-06-02 14:00 (andrea.salinas), que se deja intacta
     (cupo 4, llena, lista de espera activa).

Huecos post-14h detectados (sin superposición sala×hora ni profesional×hora):

  Sala Norte  (superior):
    15:00 → emilio.manrique   (existentes: 08, 16 en Central)
    17:00 → andrea.salinas    (existentes: 10, 14 en Central, 19 en Sur)
    19:00 → carolina.fuentes  (existentes: 09, 10, 13, 14)

  Sala Sur    (medio):
    16:00 → marcela.rios      (existentes: 08, 12, 18 en Norte)
    18:00 → emilio.manrique   (existentes: 08, 16 en Central)

  Sala Central (inferior):
    15:00 → lucas.bertoldi    (existentes: 15 en Sur, 16 en Norte — sala distinta ✓)
    17:00 → carolina.fuentes  (existentes: 09, 10, 13, 14 — libre a las 17 ✓)
    18:00 → julian.pedraza    (existentes: 11, 12, 17 en Sur, 19 en Central — libre a las 18 ✓)
"""

from datetime import date, timedelta
from typing import Sequence, Union

from alembic import op

revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, Sequence[str], None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NUEVOS_SLOTS = [
    # sala,           zona,       profesional,                          hora
    ("Sala Norte",   "superior", "emilio.manrique@endereza2.com",  "15:00"),
    ("Sala Norte",   "superior", "andrea.salinas@endereza2.com",   "17:00"),
    ("Sala Norte",   "superior", "carolina.fuentes@endereza2.com", "19:00"),
    ("Sala Sur",     "medio",    "marcela.rios@endereza2.com",     "16:00"),
    ("Sala Sur",     "medio",    "emilio.manrique@endereza2.com",  "18:00"),
    ("Sala Central", "inferior", "lucas.bertoldi@endereza2.com",   "15:00"),
    ("Sala Central", "inferior", "carolina.fuentes@endereza2.com", "17:00"),
    ("Sala Central", "inferior", "julian.pedraza@endereza2.com",   "18:00"),
]


def _dias_habiles(inicio: date, fin: date) -> list[str]:
    out = []
    cur = inicio
    while cur <= fin:
        if cur.isoweekday() in {1, 2, 3, 4, 5}:
            out.append(str(cur))
        cur += timedelta(days=1)
    return out


def _insertar_slots(fechas_values: str) -> None:
    """Inserta NUEVOS_SLOTS para el conjunto de fechas dado (SQL VALUES string)."""
    for sala, zona, email, hora in NUEVOS_SLOTS:
        op.execute(f"""
        INSERT INTO clases_programadas
            (zona_id, sala_id, profesional_email, fecha, hora,
             cupo_inicial, cupo_disponible, activo)
        SELECT
            z.id, s.id, '{email}', d.fecha, '{hora}'::time,
            30, 30, true
        FROM zonas z
        CROSS JOIN salas s
        CROSS JOIN (VALUES {fechas_values}) AS d(fecha)
        WHERE z.nombre = '{zona}'
          AND s.nombre = '{sala}'
          AND z.activo = true
          AND s.activo = true
        ON CONFLICT DO NOTHING;
        """)


def upgrade():
    # ------------------------------------------------------------------
    # 1. Limpiar datos de Romina Ortega (reservas, abonos, pagos).
    #    lista_espera NO se toca.
    #    Orden respeta FK:
    #      abono_reservas → pagos_abono → reservas → abonos
    # ------------------------------------------------------------------
    op.execute("""
    DO $$
    DECLARE
        v_usuario_id BIGINT;
    BEGIN
        SELECT id INTO v_usuario_id
        FROM usuarios
        WHERE email = 'romina.ortega@test.com';

        -- 1a. abono_reservas vinculadas a reservas de Romina
        DELETE FROM abono_reservas
        WHERE reserva_id IN (
            SELECT id FROM reservas WHERE usuario_id = v_usuario_id
        );

        -- 1b. pagos_abono de los abonos de Romina
        DELETE FROM pagos_abono
        WHERE abono_id IN (
            SELECT id FROM abonos WHERE usuario_id = v_usuario_id
        );

        -- 1c. reservas de Romina
        DELETE FROM reservas
        WHERE usuario_id = v_usuario_id;

        -- 1d. abonos de Romina
        DELETE FROM abonos
        WHERE usuario_id = v_usuario_id;

    END $$;
    """)

    # ------------------------------------------------------------------
    # 2. Nuevos slots el 29-05-2026 (viernes, post-14:00)
    # ------------------------------------------------------------------
    _insertar_slots("('2026-05-29'::date)")

    # ------------------------------------------------------------------
    # 3. Mismos slots L-V durante todo junio
    # ------------------------------------------------------------------
    dias_junio = _dias_habiles(date(2026, 6, 1), date(2026, 6, 30))
    values_junio = ", ".join(f"('{d}'::date)" for d in dias_junio)
    _insertar_slots(values_junio)

    # ------------------------------------------------------------------
    # 4. Actualizar cupo_inicial = 30 y recalcular cupo_disponible
    #    en TODAS las clases EXCEPTO Andrea Central 2026-06-02 14:00.
    #
    #    Se resuelve con dos UPDATEs separados para evitar el problema
    #    del LEFT JOIN en UPDATE...FROM con CTE de fila única en PostgreSQL:
    #      4a. Clases CON reservas activas  -> cupo_disponible = 30 - cant
    #      4b. Clases SIN reservas activas  -> cupo_disponible = 30
    # ------------------------------------------------------------------

    # Subquery reutilizable para identificar la clase protegida
    _clase_protegida_sq = """
        SELECT cp2.id
        FROM clases_programadas cp2
        JOIN salas s ON s.id = cp2.sala_id
        WHERE s.nombre                 = 'Sala Central'
          AND cp2.fecha                = '2026-06-02'
          AND cp2.hora                 = '14:00'::time
          AND cp2.profesional_email    = 'andrea.salinas@endereza2.com'
    """

    # 4a. Clases que tienen al menos una reserva activa
    op.execute(f"""
    UPDATE clases_programadas cp
    SET
        cupo_inicial    = 30,
        cupo_disponible = GREATEST(0, 30 - ra.cant)
    FROM (
        SELECT clase_programada_id, COUNT(*) AS cant
        FROM reservas
        WHERE estado != 'cancelada'::estado_reserva
        GROUP BY clase_programada_id
    ) ra
    WHERE cp.id  = ra.clase_programada_id
      AND cp.id != ({_clase_protegida_sq});
    """)

    # 4b. Clases sin ninguna reserva activa (cupo libre = 30)
    op.execute(f"""
    UPDATE clases_programadas cp
    SET
        cupo_inicial    = 30,
        cupo_disponible = 30
    WHERE cp.id NOT IN (
        SELECT clase_programada_id
        FROM reservas
        WHERE estado != 'cancelada'::estado_reserva
    )
    AND cp.id != ({_clase_protegida_sq});
    """)


def downgrade():
    # ------------------------------------------------------------------
    # Elimina los nuevos slots del 29-05 y de todo junio.
    # No restaura reservas/abonos de Romina (downgrade destructivo).
    # Restaura cupo_inicial a cupo de sala original (5/6/4 según sala).
    # ------------------------------------------------------------------

    # Borrar slots nuevos
    fechas = ["2026-05-29"] + _dias_habiles(date(2026, 6, 1), date(2026, 6, 30))
    fechas_sql = ", ".join(f"'{f}'::date" for f in fechas)
    slot_conditions = " OR ".join(
        f"(s.nombre = '{sala}' AND cp.hora = '{hora}'::time "
        f"AND cp.profesional_email = '{email}')"
        for sala, _, email, hora in NUEVOS_SLOTS
    )
    op.execute(f"""
    DELETE FROM clases_programadas cp
    USING salas s
    WHERE cp.sala_id = s.id
      AND cp.fecha IN ({fechas_sql})
      AND ({slot_conditions});
    """)

    # Restaurar cupo_inicial al cupo original de cada sala
    op.execute("""
    UPDATE clases_programadas cp
    SET
        cupo_inicial    = s.cupo,
        cupo_disponible = GREATEST(0, s.cupo - COALESCE(ra.cant, 0))
    FROM salas s
    LEFT JOIN (
        SELECT clase_programada_id, COUNT(*) AS cant
        FROM reservas
        WHERE estado NOT IN ('cancelada'::estado_reserva)
        GROUP BY clase_programada_id
    ) ra ON ra.clase_programada_id = cp.id
    WHERE cp.sala_id = s.id;
    """)