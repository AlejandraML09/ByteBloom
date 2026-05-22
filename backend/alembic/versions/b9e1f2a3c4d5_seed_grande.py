"""seed grande: clases nuevas, usuarios, reservas, abonos, lista_espera

Revision ID: b9e1f2a3c4d5
Revises: a7f3e2d1c8b9
Create Date: 2026-05-21 00:00:00.000000

Usuarios creados (contraseña: 'prueba'):
  carlos.diaz@test.com       → abono superior (Marcela, L 08:00)
  lucia.fernandez@test.com   → reservas sueltas medio/inferior
  martin.gomez@test.com      → reservas sueltas superior
  florencia.herrera@test.com → abono medio (Carolina, L 13:00)
  diego.ibanez@test.com      → reserva inferior Emilio 01/06 09:00 (cupo lleno)
  camila.juarez@test.com     → reserva inferior Emilio 01/06 09:00 (cupo lleno)
  pablo.lemos@test.com       → reserva inferior Emilio 01/06 09:00 (cupo lleno)
  natalia.mendez@test.com    → abono inferior (Andrea, Ma 14:00) + reserva Emilio 01/06
  sergio.nunez@test.com      → reserva inferior Emilio 01/06 09:00 (llena cupo=5)
  romina.ortega@test.com     → abono superior (Marcela, V 08:00) +
                               abono medio    (Julian,  Ma 10:00) +
                               lista de espera en Emilio 01/06

Clase con cupo lleno para lista de espera:
  Emilio Manrique · inferior · 2026-06-01 · 09:00 · cupo=5
  → 5 reservas: Diego, Camila, Pablo, Natalia, Sergio
  → Lista de espera: Romina (prioridad 1), Lucía (prioridad 2)
"""
from datetime import date, timedelta
from typing import Sequence, Union
from alembic import op

revision: str = "b9e1f2a3c4d5"
down_revision: Union[str, Sequence[str], None] = "a7f3e2d1c8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# bcrypt de 'prueba' (cost 12)
PWD = "$2b$12$GSJXo3ZqON3BXRIOPUZL2ub5AsWlb6yjPzRz8m/bsfxATD.YoNQAW"

START = date(2026, 5, 21)
END   = date(2026, 7, 10)

SCHEDULE = [
    ("marcela.rios@endereza2.com",      {1, 2, 5}, "08:00"),
    ("marcela.rios@endereza2.com",      {4},       "12:00"),
    ("julian.pedraza@endereza2.com",    {2, 4},    "10:00"),
    ("andrea.salinas@endereza2.com",    {1, 2, 5}, "14:00"),
    ("lucas.bertoldi@endereza2.com",    {2, 4, 5}, "11:00"),
    ("lucas.bertoldi@endereza2.com",    {1},       "15:00"),
    ("carolina.fuentes@endereza2.com",  {1, 2, 4}, "13:00"),
    ("carolina.fuentes@endereza2.com",  {5},       "16:00"),
    ("emilio.manrique@endereza2.com",   {1, 5},    "09:00"),
]


def _dates_for(dias: set) -> list:
    result = []
    current = START
    while current <= END:
        if current.isoweekday() in dias:
            result.append(str(current))
        current += timedelta(days=1)
    return result


def upgrade():

    # ── 1. Clases nuevas ───────────────────────────────────────────────────────
    op.execute("""
    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 5, true, 'marcela.rios@endereza2.com'
    FROM zonas z WHERE z.nombre = 'superior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'marcela.rios@endereza2.com'
          AND c.cupo_maximo = 5
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 7, true, 'julian.pedraza@endereza2.com'
    FROM zonas z WHERE z.nombre = 'medio'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'julian.pedraza@endereza2.com'
          AND c.cupo_maximo = 7
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 8, true, 'andrea.salinas@endereza2.com'
    FROM zonas z WHERE z.nombre = 'inferior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'andrea.salinas@endereza2.com'
          AND c.cupo_maximo = 8
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 6, true, 'lucas.bertoldi@endereza2.com'
    FROM zonas z WHERE z.nombre = 'superior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'lucas.bertoldi@endereza2.com'
          AND c.cupo_maximo = 6
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 6, true, 'carolina.fuentes@endereza2.com'
    FROM zonas z WHERE z.nombre = 'medio'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'carolina.fuentes@endereza2.com'
          AND c.cupo_maximo = 6
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 5, true, 'emilio.manrique@endereza2.com'
    FROM zonas z WHERE z.nombre = 'inferior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'emilio.manrique@endereza2.com'
          AND c.cupo_maximo = 5
    );
    """)

    # ── 2. Clases programadas ──────────────────────────────────────────────────
    for email, dias, hora in SCHEDULE:
        fechas = _dates_for(dias)
        values = ", ".join(f"('{d}'::date)" for d in fechas)
        op.execute(f"""
        INSERT INTO clases_programadas (clase_id, fecha, hora, cupo_disponible)
        SELECT c.id, d.fecha, '{hora}'::time, c.cupo_maximo
        FROM clases c
        CROSS JOIN (VALUES {values}) AS d(fecha)
        WHERE c.profesional_email = '{email}'
          AND c.activo = true
          AND c.cupo_maximo = {5 if email in ('marcela.rios@endereza2.com','emilio.manrique@endereza2.com') else 7 if email == 'julian.pedraza@endereza2.com' else 8 if email == 'andrea.salinas@endereza2.com' else 6}
          AND NOT EXISTS (
              SELECT 1 FROM clases_programadas cp
              WHERE cp.clase_id = c.id
                AND cp.fecha = d.fecha
                AND cp.hora = '{hora}'::time
          );
        """)

    # ── 3. Usuarios nuevos ─────────────────────────────────────────────────────
    op.execute(f"""
    INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
    VALUES
      ('Carlos',    'Díaz',      40000001, 'carlos.diaz@test.com',       '{PWD}', '1991-04-10', 'usuario'::rol_usuario),
      ('Lucía',     'Fernández', 40000002, 'lucia.fernandez@test.com',   '{PWD}', '1994-08-23', 'usuario'::rol_usuario),
      ('Martín',    'Gómez',     40000003, 'martin.gomez@test.com',      '{PWD}', '1989-12-05', 'usuario'::rol_usuario),
      ('Florencia', 'Herrera',   40000004, 'florencia.herrera@test.com', '{PWD}', '1995-03-17', 'usuario'::rol_usuario),
      ('Diego',     'Ibáñez',    40000005, 'diego.ibanez@test.com',      '{PWD}', '1987-06-29', 'usuario'::rol_usuario),
      ('Camila',    'Juárez',    40000006, 'camila.juarez@test.com',     '{PWD}', '1993-01-14', 'usuario'::rol_usuario),
      ('Pablo',     'Lemos',     40000007, 'pablo.lemos@test.com',       '{PWD}', '1990-09-08', 'usuario'::rol_usuario),
      ('Natalia',   'Méndez',    40000008, 'natalia.mendez@test.com',    '{PWD}', '1992-11-21', 'usuario'::rol_usuario),
      ('Sergio',    'Núñez',     40000009, 'sergio.nunez@test.com',      '{PWD}', '1986-07-03', 'usuario'::rol_usuario),
      ('Romina',    'Ortega',    40000010, 'romina.ortega@test.com',     '{PWD}', '1997-05-16', 'usuario'::rol_usuario)
    ON CONFLICT (email) DO NOTHING;
    """)

    # ── 4. Reservas sueltas (sin abono) ───────────────────────────────────────

    # Lucía → medio Julian 10:00 (martes) y Andrea inferior 14:00 (martes)
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-06-02'::date, '10:00'::time, 'medio',    'confirmada'),
        ('2026-06-09'::date, '10:00'::time, 'medio',    'pendiente'),
        ('2026-06-03'::date, '14:00'::time, 'inferior', 'confirmada')
    ) AS vals(fecha, hora, zona, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases c              ON c.id = cp.clase_id
    JOIN zonas z               ON z.id = c.zona_id AND z.nombre = vals.zona
    JOIN usuarios u            ON u.email = 'lucia.fernandez@test.com'
    JOIN medios_pago mp        ON mp.nombre = 'Mercado Pago'
    WHERE c.cupo_maximo IN (7, 8)
    ON CONFLICT DO NOTHING;
    """)

    # Martín → superior Lucas 11:00 (martes y jueves)
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-06-02'::date, '11:00'::time, 'confirmada'),
        ('2026-06-04'::date, '11:00'::time, 'confirmada'),
        ('2026-06-09'::date, '11:00'::time, 'pendiente')
    ) AS vals(fecha, hora, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora
    JOIN clases c              ON c.id = cp.clase_id
    JOIN zonas z               ON z.id = c.zona_id AND z.nombre = 'superior'
    JOIN usuarios u            ON u.email = 'martin.gomez@test.com'
    JOIN medios_pago mp        ON mp.nombre = 'Efectivo'
    WHERE c.cupo_maximo = 6
    ON CONFLICT DO NOTHING;
    """)

    # ── 5. Abonos + reservas vinculadas ───────────────────────────────────────

    # Carlos → abono superior (Marcela, L 08:00): 1/6, 8/6, 15/6, 22/6
    op.execute("""
    WITH abono AS (
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
        SELECT u.id, z.id, '2026-06-01', z.precio, 10, 'activo'::estado_abono, true
        FROM usuarios u, zonas z
        WHERE u.email = 'carlos.diaz@test.com' AND z.nombre = 'superior'
        ON CONFLICT (usuario_id, zona_id) DO NOTHING
        RETURNING id, usuario_id, zona_id
    ),
    reservas_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT a.usuario_id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM abono a
        JOIN zonas z ON z.id = a.zona_id
        JOIN clases c ON c.zona_id = z.id AND c.profesional_email = 'marcela.rios@endereza2.com' AND c.cupo_maximo = 5
        JOIN clases_programadas cp ON cp.clase_id = c.id
            AND cp.fecha IN ('2026-06-01'::date, '2026-06-08'::date, '2026-06-15'::date, '2026-06-22'::date)
            AND cp.hora = '08:00'::time
        JOIN medios_pago mp ON mp.nombre = 'Transferencia'
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM abono a, reservas_ins r
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1
    WHERE id IN (
        SELECT cp.id FROM clases_programadas cp
        JOIN clases c ON c.id = cp.clase_id
        WHERE c.profesional_email = 'marcela.rios@endereza2.com'
          AND c.cupo_maximo = 5
          AND cp.fecha IN ('2026-06-01','2026-06-08','2026-06-15','2026-06-22')
          AND cp.hora = '08:00'
    );
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual, 'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u ON u.id = a.usuario_id AND u.email = 'carlos.diaz@test.com'
    JOIN zonas z ON z.id = a.zona_id AND z.nombre = 'superior'
    JOIN medios_pago mp ON mp.nombre = 'Transferencia'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # Florencia → abono medio (Carolina, L 13:00): 1/6, 8/6, 15/6, 22/6
    op.execute("""
    WITH abono AS (
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
        SELECT u.id, z.id, '2026-06-01', z.precio, 10, 'activo'::estado_abono, true
        FROM usuarios u, zonas z
        WHERE u.email = 'florencia.herrera@test.com' AND z.nombre = 'medio'
        ON CONFLICT (usuario_id, zona_id) DO NOTHING
        RETURNING id, usuario_id, zona_id
    ),
    reservas_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT a.usuario_id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM abono a
        JOIN zonas z ON z.id = a.zona_id
        JOIN clases c ON c.zona_id = z.id AND c.profesional_email = 'carolina.fuentes@endereza2.com' AND c.cupo_maximo = 6
        JOIN clases_programadas cp ON cp.clase_id = c.id
            AND cp.fecha IN ('2026-06-01'::date, '2026-06-08'::date, '2026-06-15'::date, '2026-06-22'::date)
            AND cp.hora = '13:00'::time
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM abono a, reservas_ins r
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1
    WHERE id IN (
        SELECT cp.id FROM clases_programadas cp
        JOIN clases c ON c.id = cp.clase_id
        WHERE c.profesional_email = 'carolina.fuentes@endereza2.com'
          AND c.cupo_maximo = 6
          AND cp.fecha IN ('2026-06-01','2026-06-08','2026-06-15','2026-06-22')
          AND cp.hora = '13:00'
    );
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual, 'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u ON u.id = a.usuario_id AND u.email = 'florencia.herrera@test.com'
    JOIN zonas z ON z.id = a.zona_id AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # Natalia → abono inferior (Andrea, Ma 14:00): 2/6, 9/6, 16/6, 23/6
    op.execute("""
    WITH abono AS (
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
        SELECT u.id, z.id, '2026-06-01', z.precio, 10, 'activo'::estado_abono, true
        FROM usuarios u, zonas z
        WHERE u.email = 'natalia.mendez@test.com' AND z.nombre = 'inferior'
        ON CONFLICT (usuario_id, zona_id) DO NOTHING
        RETURNING id, usuario_id, zona_id
    ),
    reservas_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT a.usuario_id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM abono a
        JOIN zonas z ON z.id = a.zona_id
        JOIN clases c ON c.zona_id = z.id AND c.profesional_email = 'andrea.salinas@endereza2.com' AND c.cupo_maximo = 8
        JOIN clases_programadas cp ON cp.clase_id = c.id
            AND cp.fecha IN ('2026-06-02'::date, '2026-06-09'::date, '2026-06-16'::date, '2026-06-23'::date)
            AND cp.hora = '14:00'::time
        JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM abono a, reservas_ins r
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1
    WHERE id IN (
        SELECT cp.id FROM clases_programadas cp
        JOIN clases c ON c.id = cp.clase_id
        WHERE c.profesional_email = 'andrea.salinas@endereza2.com'
          AND c.cupo_maximo = 8
          AND cp.fecha IN ('2026-06-02','2026-06-09','2026-06-16','2026-06-23')
          AND cp.hora = '14:00'
    );
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual, 'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u ON u.id = a.usuario_id AND u.email = 'natalia.mendez@test.com'
    JOIN zonas z ON z.id = a.zona_id AND z.nombre = 'inferior'
    JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # Romina → abono superior (Marcela, V 08:00): 5/6, 12/6, 19/6, 26/6
    op.execute("""
    WITH abono AS (
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
        SELECT u.id, z.id, '2026-06-01', z.precio, 10, 'activo'::estado_abono, true
        FROM usuarios u, zonas z
        WHERE u.email = 'romina.ortega@test.com' AND z.nombre = 'superior'
        ON CONFLICT (usuario_id, zona_id) DO NOTHING
        RETURNING id, usuario_id, zona_id
    ),
    reservas_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT a.usuario_id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM abono a
        JOIN zonas z ON z.id = a.zona_id
        JOIN clases c ON c.zona_id = z.id AND c.profesional_email = 'marcela.rios@endereza2.com' AND c.cupo_maximo = 5
        JOIN clases_programadas cp ON cp.clase_id = c.id
            AND cp.fecha IN ('2026-06-05'::date, '2026-06-12'::date, '2026-06-19'::date, '2026-06-26'::date)
            AND cp.hora = '08:00'::time
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM abono a, reservas_ins r
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1
    WHERE id IN (
        SELECT cp.id FROM clases_programadas cp
        JOIN clases c ON c.id = cp.clase_id
        WHERE c.profesional_email = 'marcela.rios@endereza2.com'
          AND c.cupo_maximo = 5
          AND cp.fecha IN ('2026-06-05','2026-06-12','2026-06-19','2026-06-26')
          AND cp.hora = '08:00'
    );
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual, 'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u ON u.id = a.usuario_id AND u.email = 'romina.ortega@test.com'
    JOIN zonas z ON z.id = a.zona_id AND z.nombre = 'superior'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # Romina → abono medio (Julian, Ma 10:00): 2/6, 9/6, 16/6, 23/6
    op.execute("""
    WITH abono AS (
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
        SELECT u.id, z.id, '2026-06-01', z.precio, 10, 'activo'::estado_abono, true
        FROM usuarios u, zonas z
        WHERE u.email = 'romina.ortega@test.com' AND z.nombre = 'medio'
        ON CONFLICT (usuario_id, zona_id) DO NOTHING
        RETURNING id, usuario_id, zona_id
    ),
    reservas_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT a.usuario_id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM abono a
        JOIN zonas z ON z.id = a.zona_id
        JOIN clases c ON c.zona_id = z.id AND c.profesional_email = 'julian.pedraza@endereza2.com' AND c.cupo_maximo = 7
        JOIN clases_programadas cp ON cp.clase_id = c.id
            AND cp.fecha IN ('2026-06-02'::date, '2026-06-09'::date, '2026-06-16'::date, '2026-06-23'::date)
            AND cp.hora = '10:00'::time
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM abono a, reservas_ins r
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    UPDATE clases_programadas SET cupo_disponible = cupo_disponible - 1
    WHERE id IN (
        SELECT cp.id FROM clases_programadas cp
        JOIN clases c ON c.id = cp.clase_id
        WHERE c.profesional_email = 'julian.pedraza@endereza2.com'
          AND c.cupo_maximo = 7
          AND cp.fecha IN ('2026-06-02','2026-06-09','2026-06-16','2026-06-23')
          AND cp.hora = '10:00'
    );
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual, 'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u ON u.id = a.usuario_id AND u.email = 'romina.ortega@test.com'
    JOIN zonas z ON z.id = a.zona_id AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # ── 6. Llenar cupo Emilio 2026-06-01 09:00 (cupo=5) ──────────────────────
    # Diego, Camila, Pablo, Natalia, Sergio → 5 reservas → cupo lleno
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
    FROM (VALUES
        ('diego.ibanez@test.com'),
        ('camila.juarez@test.com'),
        ('pablo.lemos@test.com'),
        ('natalia.mendez@test.com'),
        ('sergio.nunez@test.com')
    ) AS vals(email)
    JOIN usuarios u ON u.email = vals.email
    JOIN clases_programadas cp ON cp.fecha = '2026-06-01'::date AND cp.hora = '09:00'::time
    JOIN clases c ON c.id = cp.clase_id AND c.profesional_email = 'emilio.manrique@endereza2.com' AND c.cupo_maximo = 5
    JOIN zonas z ON z.id = c.zona_id
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    op.execute("""
    UPDATE clases_programadas SET cupo_disponible = 0
    WHERE id = (
        SELECT cp.id FROM clases_programadas cp
        JOIN clases c ON c.id = cp.clase_id
        WHERE c.profesional_email = 'emilio.manrique@endereza2.com'
          AND c.cupo_maximo = 5
          AND cp.fecha = '2026-06-01'
          AND cp.hora = '09:00'
    );
    """)

    # ── 7. Lista de espera (Emilio 01/06 09:00 con cupo lleno) ────────────────
    # Romina → prioridad 1, Lucía → prioridad 2
    op.execute("""
    INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad, estado, activo)
    SELECT u.id, cp.id, vals.prioridad, 'esperando'::estado_lista_espera, true
    FROM (VALUES
        ('romina.ortega@test.com',   1),
        ('lucia.fernandez@test.com', 2)
    ) AS vals(email, prioridad)
    JOIN usuarios u ON u.email = vals.email
    JOIN clases_programadas cp ON cp.fecha = '2026-06-01'::date AND cp.hora = '09:00'::time
    JOIN clases c ON c.id = cp.clase_id
        AND c.profesional_email = 'emilio.manrique@endereza2.com'
        AND c.cupo_maximo = 5
    ON CONFLICT (usuario_id, clase_programada_id) DO NOTHING;
    """)


def downgrade():
    new_emails = ", ".join(f"'{e}'" for e in [
        'carlos.diaz@test.com', 'lucia.fernandez@test.com', 'martin.gomez@test.com',
        'florencia.herrera@test.com', 'diego.ibanez@test.com', 'camila.juarez@test.com',
        'pablo.lemos@test.com', 'natalia.mendez@test.com', 'sergio.nunez@test.com',
        'romina.ortega@test.com',
    ])
    new_prof_emails = ", ".join(f"'{e}'" for e in [
        'marcela.rios@endereza2.com', 'julian.pedraza@endereza2.com',
        'andrea.salinas@endereza2.com', 'lucas.bertoldi@endereza2.com',
        'carolina.fuentes@endereza2.com', 'emilio.manrique@endereza2.com',
    ])

    op.execute(f"""
    -- Lista de espera
    DELETE FROM lista_espera
    WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN ({new_emails}));

    -- abono_reservas de los nuevos usuarios
    DELETE FROM abono_reservas
    WHERE abono_id IN (
        SELECT a.id FROM abonos a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE u.email IN ({new_emails})
    );

    -- pagos_abono de los nuevos usuarios
    DELETE FROM pagos_abono
    WHERE abono_id IN (
        SELECT a.id FROM abonos a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE u.email IN ({new_emails})
    );

    -- abonos de los nuevos usuarios
    DELETE FROM abonos
    WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN ({new_emails}));

    -- reservas de los nuevos usuarios
    DELETE FROM reservas
    WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN ({new_emails}));

    -- restaurar cupo_disponible de clases nuevas (= cupo_maximo, ya que solo estas reservas las afectan)
    UPDATE clases_programadas SET cupo_disponible = c.cupo_maximo
    FROM clases c
    WHERE clases_programadas.clase_id = c.id
      AND c.profesional_email IN ({new_prof_emails})
      AND c.cupo_maximo IN (5, 6, 7, 8);

    -- clases_programadas de las clases nuevas
    DELETE FROM clases_programadas
    WHERE clase_id IN (
        SELECT id FROM clases
        WHERE profesional_email IN ({new_prof_emails})
          AND cupo_maximo IN (5, 6, 7, 8)
    );

    -- clases nuevas
    DELETE FROM clases
    WHERE profesional_email IN ({new_prof_emails})
      AND cupo_maximo IN (5, 6, 7, 8);

    -- usuarios nuevos
    DELETE FROM usuarios WHERE email IN ({new_emails});
    """)