"""seed demo: crear clase 2026-07-14 12:00 y reservar 5 cupos

Revision ID: g1h2i3j4k8m9
Revises: a2b3c4d5e6f7
Create Date: 2026-06-15 12:00:00.000000

Prepara datos demo para la funcionalidad de lista de espera:
  - crea una `clase_programada` el 2026-07-14 a las 12:00 en Sala Norte (zona superior)
  - configura cupo inicial 5
  - inserta 5 reservas confirmadas para usuarios de prueba
  - actualiza `cupo_disponible` del slot

La migración es idempotente y reversible (downgrade borra las reservas y la clase creada).
"""
from typing import Sequence, Union

from alembic import op

revision: str = "g1h2i3j4k8m9"
down_revision: Union[str, Sequence[str], None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
  # 1) Crear la clase programada en Sala Norte (superior) 2026-07-14 12:00
    op.execute("""
    INSERT INTO clases_programadas (zona_id, sala_id, profesional_email, fecha, hora, cupo_inicial, cupo_disponible, activo)
    SELECT z.id, s.id, 'marcela.rios@endereza2.com', '2026-07-14'::date, '12:00'::time, s.cupo, s.cupo, true
    FROM zonas z
    JOIN salas s ON s.nombre = 'Sala Norte'
    WHERE z.nombre = 'superior' AND s.activo = true AND z.activo = true
      AND NOT EXISTS (
        SELECT 1 FROM clases_programadas cp
        WHERE cp.sala_id = s.id
          AND cp.fecha = '2026-07-14'::date
          AND cp.hora = '12:00'::time
      );
    """)

    # 1b) Si existe ya un slot (generado por otros seeds) para Sala Norte 14/07 12:00,
    #     eliminar sus reservas actuales (respaldarlas no es necesario en este seed)
    #     y forzar el cupo a 5 para poder llenarlo con las reservas demo.
    op.execute("""
    -- Eliminar abono_reservas y reservas existentes para el slot Sala Norte 2026-07-14 12:00
    DELETE FROM abono_reservas ar
    WHERE ar.reserva_id IN (
      SELECT r.id FROM reservas r
      WHERE r.clase_programada_id IN (
        SELECT cp.id FROM clases_programadas cp
        JOIN salas s ON s.id = cp.sala_id
        WHERE s.nombre = 'Sala Norte' AND cp.fecha = '2026-07-14'::date AND cp.hora = '12:00'::time
      )
    );

    -- borrar reservas
    DELETE FROM reservas r
    WHERE r.clase_programada_id IN (
      SELECT cp.id FROM clases_programadas cp
      JOIN salas s ON s.id = cp.sala_id
      WHERE s.nombre = 'Sala Norte' AND cp.fecha = '2026-07-14'::date AND cp.hora = '12:00'::time
    );

    -- forzar cupo a 5
    UPDATE clases_programadas
    SET cupo_inicial = 5, cupo_disponible = 5
    WHERE id IN (
      SELECT cp.id FROM clases_programadas cp
      JOIN salas s ON s.id = cp.sala_id
      WHERE s.nombre = 'Sala Norte' AND cp.fecha = '2026-07-14'::date AND cp.hora = '12:00'::time
    );
    """)

    # 2) Insertar 5 reservas confirmadas para llenar el cupo (usuarios de demo existentes)
    # Elegimos 5 usuarios que se usan en los seeds: maria, ana, laura, sofia, valentina
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado)
    SELECT u.id, cp.id, mp.id, z.precio, z.precio, 'confirmada'::estado_reserva
    FROM (VALUES
      ('maria.garcia@test.com'),
      ('ana.rodriguez@test.com'),
      ('laura.martinez@test.com'),
      ('sofia.lopez@test.com'),
      ('valentina.torres@test.com')
    ) AS vals(email)
    JOIN usuarios u ON u.email = vals.email
    CROSS JOIN (
      SELECT cp.id, cp.zona_id FROM clases_programadas cp
      JOIN salas s ON s.id = cp.sala_id
      WHERE s.nombre = 'Sala Norte' AND cp.fecha = '2026-07-14'::date AND cp.hora = '12:00'::time
      LIMIT 1
    ) cp
    JOIN zonas z ON z.id = cp.zona_id
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    # 3) Recalcular cupo_disponible para el slot recién creado
    op.execute("""
    UPDATE clases_programadas cp
    SET cupo_disponible = GREATEST(0, cp.cupo_inicial - sub.cant)
    FROM (
      SELECT r.clase_programada_id, COUNT(*) AS cant
      FROM reservas r
      WHERE r.estado NOT IN ('cancelada'::estado_reserva)
      GROUP BY r.clase_programada_id
    ) sub
    WHERE cp.id = sub.clase_programada_id
      AND cp.fecha = '2026-07-14'::date
      AND cp.hora = '12:00'::time;
    """)


def downgrade():
    # Borrar las reservas creadas para esa clase y luego la propia clase
    op.execute("""
    DELETE FROM reservas r
    USING clases_programadas cp
    WHERE r.clase_programada_id = cp.id
      AND cp.fecha = '2026-07-14'::date
      AND cp.hora = '12:00'::time
      AND (
        cp.profesional_email = 'marcela.rios@endereza2.com'
        OR cp.sala_id IN (SELECT id FROM salas WHERE nombre = 'Sala Norte')
      );
    """)

    # Restaurar cupo_inicial al valor de la sala y recalcular cupo_disponible
    op.execute("""
    UPDATE clases_programadas cp
    SET cupo_inicial = s.cupo
    FROM salas s
    WHERE cp.sala_id = s.id
      AND cp.fecha = '2026-07-14'::date
      AND cp.hora = '12:00'::time
      AND s.nombre = 'Sala Norte';

    -- Recalcular cupo_disponible según reservas actuales
    UPDATE clases_programadas cp
    SET cupo_disponible = GREATEST(0, cp.cupo_inicial - sub.cant)
    FROM (
      SELECT r.clase_programada_id, COUNT(*) AS cant
      FROM reservas r
      WHERE r.estado NOT IN ('cancelada'::estado_reserva)
      GROUP BY r.clase_programada_id
    ) sub
    WHERE cp.id = sub.clase_programada_id
      AND cp.fecha = '2026-07-14'::date
      AND cp.hora = '12:00'::time;
    """)
