"""seed usuarios de prueba con reservas y abonos

Revision ID: f1a2b3c4d5e6
Revises: bbbdd189dd33
Create Date: 2026-05-19 20:00:00.000000

Usuarios creados (contraseña: Test1234):
  - maria.garcia@test.com    → abono superior activo, 6 reservas (pasadas + futuras)
  - ana.rodriguez@test.com   → abono medio activo,    5 reservas
  - laura.martinez@test.com  → sin abono,             5 reservas (incluye ausente)
  - sofia.lopez@test.com     → abono medio pausado,   3 reservas (incluye canceladas)
  - valentina.torres@test.com→ sin abono,             1 reserva futura
"""

from typing import Sequence, Union
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "bbbdd189dd33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# bcrypt hash de "Test1234"
PWD = "$2b$12$7A47rLFDs9bqTyKYlfVcsOgHqJrC8lvQOnXutfXhxqZK9Bi7WDYIi"

# Horarios por grupo de días:
#   LMV (isoweekday 1,3,5): superior 07:00 · medio 10:00 · inferior 17:00
#   MJS (isoweekday 2,4,6): superior 09:00 · medio 08:00 · inferior 19:00
#
# Fechas verificadas:
#   2026-05-04 Lun  2026-05-05 Mar  2026-05-06 Mié  2026-05-07 Jue
#   2026-05-08 Vie  2026-05-11 Lun  2026-05-12 Mar  2026-05-13 Mié
#   2026-05-14 Jue  2026-05-15 Vie  2026-05-19 Mar  (hoy)
#   2026-06-01 Lun  2026-06-02 Mar  2026-06-03 Mié  2026-06-04 Jue
#   2026-06-05 Vie  2026-06-09 Mar


def upgrade():
    # ── 1. Usuarios ────────────────────────────────────────────────────────────
    op.execute(f"""
    INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
    VALUES
      ('María',     'García',    30000001, 'maria.garcia@test.com',     '{PWD}', '1990-03-15', 'usuario'::rol_usuario),
      ('Ana',       'Rodríguez', 30000002, 'ana.rodriguez@test.com',    '{PWD}', '1985-07-22', 'usuario'::rol_usuario),
      ('Laura',     'Martínez',  30000003, 'laura.martinez@test.com',   '{PWD}', '1993-11-08', 'usuario'::rol_usuario),
      ('Sofía',     'López',     30000004, 'sofia.lopez@test.com',      '{PWD}', '1988-05-30', 'usuario'::rol_usuario),
      ('Valentina', 'Torres',    30000005, 'valentina.torres@test.com', '{PWD}', '1996-02-14', 'usuario'::rol_usuario)
    ON CONFLICT (email) DO NOTHING;
    """)

    # ── 2. Reservas ────────────────────────────────────────────────────────────
    # Cada bloque usa un CTE que localiza la clase_programada por zona+fecha+hora
    # y el usuario/medio_pago por nombre/email, sin depender de IDs hardcodeados.

    op.execute("""
    -- María García: superior · Transferencia
    -- Pasadas → asistio · Futuras → confirmada
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT
        u.id,
        cp.id,
        mp.id,
        z.precio,
        vals.estado::estado_reserva
    FROM (VALUES
        ('2026-05-04'::date, '07:00:00'::time, 'asistio'),
        ('2026-05-06'::date, '07:00:00'::time, 'asistio'),
        ('2026-05-08'::date, '07:00:00'::time, 'asistio'),
        ('2026-05-13'::date, '07:00:00'::time, 'asistio'),
        ('2026-06-01'::date, '07:00:00'::time, 'confirmada'),
        ('2026-06-03'::date, '07:00:00'::time, 'confirmada')
    ) AS vals(fecha, hora, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases            c  ON c.id = cp.clase_id
    JOIN zonas             z  ON z.id = c.zona_id AND z.nombre = 'superior'
    JOIN usuarios          u  ON u.email = 'maria.garcia@test.com'
    JOIN medios_pago       mp ON mp.nombre = 'Transferencia'
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    -- Ana Rodríguez: medio · Efectivo
    -- Pasadas → asistio · Hoy y futuras → pendiente
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT
        u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-05-05'::date, '08:00:00'::time, 'asistio'),
        ('2026-05-07'::date, '08:00:00'::time, 'asistio'),
        ('2026-05-12'::date, '08:00:00'::time, 'asistio'),
        ('2026-05-19'::date, '08:00:00'::time, 'pendiente'),
        ('2026-06-02'::date, '08:00:00'::time, 'confirmada')
    ) AS vals(fecha, hora, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases            c  ON c.id = cp.clase_id
    JOIN zonas             z  ON z.id = c.zona_id AND z.nombre = 'medio'
    JOIN usuarios          u  ON u.email = 'ana.rodriguez@test.com'
    JOIN medios_pago       mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    -- Laura Martínez: inferior · Efectivo
    -- Pasadas → asistio + ausente · Futuras → pendiente
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT
        u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-05-05'::date, '19:00:00'::time, 'asistio'),
        ('2026-05-07'::date, '19:00:00'::time, 'asistio'),
        ('2026-05-14'::date, '19:00:00'::time, 'ausente'),
        ('2026-06-02'::date, '19:00:00'::time, 'pendiente'),
        ('2026-06-04'::date, '19:00:00'::time, 'pendiente')
    ) AS vals(fecha, hora, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases            c  ON c.id = cp.clase_id
    JOIN zonas             z  ON z.id = c.zona_id AND z.nombre = 'inferior'
    JOIN usuarios          u  ON u.email = 'laura.martinez@test.com'
    JOIN medios_pago       mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    -- Sofía López: medio · Mercado Pago (asistio + canceladas)
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT
        u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-05-04'::date, '10:00:00'::time, 'asistio'),
        ('2026-05-06'::date, '10:00:00'::time, 'cancelada'),
        ('2026-05-11'::date, '10:00:00'::time, 'cancelada')
    ) AS vals(fecha, hora, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases            c  ON c.id = cp.clase_id
    JOIN zonas             z  ON z.id = c.zona_id AND z.nombre = 'medio'
    JOIN usuarios          u  ON u.email = 'sofia.lopez@test.com'
    JOIN medios_pago       mp ON mp.nombre = 'Mercado Pago'
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    -- Valentina Torres: superior · Efectivo (sola reserva futura)
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT
        u.id, cp.id, mp.id, z.precio, 'pendiente'::estado_reserva
    FROM (VALUES
        ('2026-06-01'::date, '07:00:00'::time)
    ) AS vals(fecha, hora)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases            c  ON c.id = cp.clase_id
    JOIN zonas             z  ON z.id = c.zona_id AND z.nombre = 'superior'
    JOIN usuarios          u  ON u.email = 'valentina.torres@test.com'
    JOIN medios_pago       mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    # ── 3. Ajustar cupo_disponible para slots con reservas activas ─────────────
    # Solo para fechas futuras o de hoy (pasadas ya no importan operacionalmente)
    op.execute("""
    UPDATE clases_programadas cp
    SET cupo_disponible = GREATEST(
        0,
        cp.cupo_disponible - sub.cant
    )
    FROM (
        SELECT r.clase_programada_id, COUNT(*) AS cant
        FROM reservas r
        JOIN usuarios u ON u.id = r.usuario_id
        WHERE u.email IN (
            'maria.garcia@test.com',
            'ana.rodriguez@test.com',
            'laura.martinez@test.com',
            'sofia.lopez@test.com',
            'valentina.torres@test.com'
        )
        AND r.estado NOT IN ('cancelada'::estado_reserva)
        GROUP BY r.clase_programada_id
    ) sub
    WHERE cp.id = sub.clase_programada_id
    AND cp.fecha >= CURRENT_DATE;
    """)

    # ── 4. Abonos ──────────────────────────────────────────────────────────────
    op.execute("""
    -- María: superior activo
    INSERT INTO abonos
        (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
    SELECT u.id, z.id, '2026-05-01', z.precio, 10, 'activo'::estado_abono, true
    FROM usuarios u, zonas z
    WHERE u.email = 'maria.garcia@test.com' AND z.nombre = 'superior'
    ON CONFLICT (usuario_id, zona_id) DO NOTHING;

    -- Ana: medio activo
    INSERT INTO abonos
        (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
    SELECT u.id, z.id, '2026-05-01', z.precio, 10, 'activo'::estado_abono, true
    FROM usuarios u, zonas z
    WHERE u.email = 'ana.rodriguez@test.com' AND z.nombre = 'medio'
    ON CONFLICT (usuario_id, zona_id) DO NOTHING;

    -- Sofía: medio pausado (desde abril)
    INSERT INTO abonos
        (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
    SELECT u.id, z.id, '2026-04-01', z.precio, 10, 'pausado'::estado_abono, false
    FROM usuarios u, zonas z
    WHERE u.email = 'sofia.lopez@test.com' AND z.nombre = 'medio'
    ON CONFLICT (usuario_id, zona_id) DO NOTHING;
    """)

    # ── 5. Pagos de abono ──────────────────────────────────────────────────────
    op.execute("""
    -- María superior: Mayo pagado · Junio pendiente
    INSERT INTO pagos_abono
        (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, fecha_pago, monto, estado)
    SELECT
        a.id, mp.id, 2026, 5, '2026-05-10', '2026-05-08 10:30:00', a.monto_mensual,
        'pagado'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'maria.garcia@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'superior'
    JOIN medios_pago mp ON mp.nombre = 'Transferencia'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;

    INSERT INTO pagos_abono
        (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT
        a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual,
        'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'maria.garcia@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'superior'
    JOIN medios_pago mp ON mp.nombre = 'Transferencia'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;

    -- Ana medio: Mayo pendiente
    INSERT INTO pagos_abono
        (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT
        a.id, mp.id, 2026, 5, '2026-05-10', a.monto_mensual,
        'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'ana.rodriguez@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;

    -- Sofía medio (pausado): Abril pagado · Mayo vencido
    INSERT INTO pagos_abono
        (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, fecha_pago, monto, estado)
    SELECT
        a.id, mp.id, 2026, 4, '2026-04-10', '2026-04-07 09:00:00', a.monto_mensual,
        'pagado'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'sofia.lopez@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;

    INSERT INTO pagos_abono
        (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT
        a.id, mp.id, 2026, 5, '2026-05-10', a.monto_mensual,
        'vencido'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'sofia.lopez@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)


def downgrade():
    test_emails = (
        "'maria.garcia@test.com'",
        "'ana.rodriguez@test.com'",
        "'laura.martinez@test.com'",
        "'sofia.lopez@test.com'",
        "'valentina.torres@test.com'",
    )
    emails_list = ", ".join(test_emails)

    # pagos_abono → abonos → reservas → usuarios (cascade elimina hijos)
    op.execute(f"""
    DELETE FROM pagos_abono
    WHERE abono_id IN (
        SELECT a.id FROM abonos a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE u.email IN ({emails_list})
    );

    DELETE FROM abonos
    WHERE usuario_id IN (
        SELECT id FROM usuarios WHERE email IN ({emails_list})
    );

    -- Restaurar cupo_disponible de los slots futuros afectados
    UPDATE clases_programadas cp
    SET cupo_disponible = cp.cupo_disponible + sub.cant
    FROM (
        SELECT r.clase_programada_id, COUNT(*) AS cant
        FROM reservas r
        JOIN usuarios u ON u.id = r.usuario_id
        WHERE u.email IN ({emails_list})
          AND r.estado NOT IN ('cancelada'::estado_reserva)
        GROUP BY r.clase_programada_id
    ) sub
    JOIN clases_programadas cp2 ON cp2.id = sub.clase_programada_id
    WHERE cp.id = sub.clase_programada_id
    AND cp.fecha >= CURRENT_DATE;

    DELETE FROM reservas
    WHERE usuario_id IN (
        SELECT id FROM usuarios WHERE email IN ({emails_list})
    );

    DELETE FROM usuarios WHERE email IN ({emails_list});
    """)
