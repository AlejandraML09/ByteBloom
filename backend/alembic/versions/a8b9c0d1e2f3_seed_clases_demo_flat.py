"""seed clases_programadas + usuarios prueba (shape flat)

Revision ID: a8b9c0d1e2f3
Revises: f7a1b8c9d3e0
Create Date: 2026-05-22 13:00:00.000000

Repuebla el sistema en el shape nuevo (sala_id + zona_id + profesional_email +
cupo_inicial), reemplazando los seeds antiguos eliminados que apuntaban a la
tabla `clases` (ya inexistente).

Contenido:
  - 15 usuarios de prueba (10 del seed_grande + 5 del seed_usuarios_prueba)
  - clases_programadas L-V 08:00-19:00, distribuidas en las 3 salas existentes,
    de 2026-05-22 hasta 2026-07-31 (~50 dias habiles x 17 slots por dia).
  - Abonos + reservas vinculadas (Carlos, Florencia, Natalia, Romina, Maria, Ana, Sofia)
  - Reservas sueltas (Lucia, Martin, Valentina, Sergio)
  - Lista de espera: Andrea Central 2026-06-02 14:00 (cupo 4 lleno)

Distribucion (sala, hora, profesional, zona):
  Sala Norte   (cupo 5, superior):  08 Marcela, 10 Carolina, 12 Marcela,
                                    14 Carolina, 16 Lucas, 18 Marcela
  Sala Sur     (cupo 6, medio):     09 Carolina, 11 Julian,  13 Carolina,
                                    15 Lucas,    17 Julian,  19 Andrea
  Sala Central (cupo 4, inferior):  08 Emilio,   10 Andrea,  12 Julian,
                                    14 Andrea,   16 Emilio,  19 Julian
"""
from datetime import date, timedelta
from typing import Sequence, Union
from alembic import op

revision: str = "a8b9c0d1e2f3"
down_revision: Union[str, Sequence[str], None] = "f7a1b8c9d3e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# bcrypt hash de "Test1234" (cost 12) — reutilizado en todos los usuarios demo
PWD = "$2b$12$.l/4WTnBaCkxSxqayVq5ZOQcCOTMtzeu04xZouhj2mrEb6mN9hsWG"

START = date(2026, 5, 22)
END = date(2026, 7, 31)

# (sala, zona, profesional, hora) - se replica L-V en todo el rango
DISTRIBUCION = [
    # Sala Norte - superior
    ("Sala Norte",   "superior", "marcela.rios@endereza2.com",     "08:00"),
    ("Sala Norte",   "superior", "carolina.fuentes@endereza2.com", "10:00"),
    ("Sala Norte",   "superior", "marcela.rios@endereza2.com",     "12:00"),
    ("Sala Norte",   "superior", "carolina.fuentes@endereza2.com", "14:00"),
    ("Sala Norte",   "superior", "lucas.bertoldi@endereza2.com",   "16:00"),
    ("Sala Norte",   "superior", "marcela.rios@endereza2.com",     "18:00"),
    # Sala Sur - medio
    ("Sala Sur",     "medio",    "carolina.fuentes@endereza2.com", "09:00"),
    ("Sala Sur",     "medio",    "julian.pedraza@endereza2.com",   "11:00"),
    ("Sala Sur",     "medio",    "carolina.fuentes@endereza2.com", "13:00"),
    ("Sala Sur",     "medio",    "lucas.bertoldi@endereza2.com",   "15:00"),
    ("Sala Sur",     "medio",    "julian.pedraza@endereza2.com",   "17:00"),
    ("Sala Sur",     "medio",    "andrea.salinas@endereza2.com",   "19:00"),
    # Sala Central - inferior
    ("Sala Central", "inferior", "emilio.manrique@endereza2.com",  "08:00"),
    ("Sala Central", "inferior", "andrea.salinas@endereza2.com",   "10:00"),
    ("Sala Central", "inferior", "julian.pedraza@endereza2.com",   "12:00"),
    ("Sala Central", "inferior", "andrea.salinas@endereza2.com",   "14:00"),
    ("Sala Central", "inferior", "emilio.manrique@endereza2.com",  "16:00"),
    ("Sala Central", "inferior", "julian.pedraza@endereza2.com",   "19:00"),
]


def _weekdays_in_range() -> list[str]:
    out = []
    cur = START
    while cur <= END:
        if cur.isoweekday() in {1, 2, 3, 4, 5}:
            out.append(str(cur))
        cur += timedelta(days=1)
    return out


def upgrade():
    # ── 1. Usuarios de prueba ─────────────────────────────────────────────────
    op.execute(f"""
    INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
    VALUES
      ('Maria',     'Garcia',    30000001, 'maria.garcia@test.com',     '{PWD}', '1990-03-15', 'usuario'::rol_usuario),
      ('Ana',       'Rodriguez', 30000002, 'ana.rodriguez@test.com',    '{PWD}', '1985-07-22', 'usuario'::rol_usuario),
      ('Laura',     'Martinez',  30000003, 'laura.martinez@test.com',   '{PWD}', '1993-11-08', 'usuario'::rol_usuario),
      ('Sofia',     'Lopez',     30000004, 'sofia.lopez@test.com',      '{PWD}', '1988-05-30', 'usuario'::rol_usuario),
      ('Valentina', 'Torres',    30000005, 'valentina.torres@test.com', '{PWD}', '1996-02-14', 'usuario'::rol_usuario),
      ('Carlos',    'Diaz',      40000001, 'carlos.diaz@test.com',      '{PWD}', '1991-04-10', 'usuario'::rol_usuario),
      ('Lucia',     'Fernandez', 40000002, 'lucia.fernandez@test.com',  '{PWD}', '1994-08-23', 'usuario'::rol_usuario),
      ('Martin',    'Gomez',     40000003, 'martin.gomez@test.com',     '{PWD}', '1989-12-05', 'usuario'::rol_usuario),
      ('Florencia', 'Herrera',   40000004, 'florencia.herrera@test.com','{PWD}', '1995-03-17', 'usuario'::rol_usuario),
      ('Diego',     'Ibanez',    40000005, 'diego.ibanez@test.com',     '{PWD}', '1987-06-29', 'usuario'::rol_usuario),
      ('Camila',    'Juarez',    40000006, 'camila.juarez@test.com',    '{PWD}', '1993-01-14', 'usuario'::rol_usuario),
      ('Pablo',     'Lemos',     40000007, 'pablo.lemos@test.com',      '{PWD}', '1990-09-08', 'usuario'::rol_usuario),
      ('Natalia',   'Mendez',    40000008, 'natalia.mendez@test.com',   '{PWD}', '1992-11-21', 'usuario'::rol_usuario),
      ('Sergio',    'Nunez',     40000009, 'sergio.nunez@test.com',     '{PWD}', '1986-07-03', 'usuario'::rol_usuario),
      ('Romina',    'Ortega',    40000010, 'romina.ortega@test.com',    '{PWD}', '1997-05-16', 'usuario'::rol_usuario)
    ON CONFLICT (email) DO NOTHING;
    """)

    # ── 2. clases_programadas (shape flat: zona_id + sala_id + profesional_email) ──
    fechas = _weekdays_in_range()
    values_fechas = ", ".join(f"('{d}'::date)" for d in fechas)

    for sala, zona, email, hora in DISTRIBUCION:
        op.execute(f"""
        INSERT INTO clases_programadas
            (zona_id, sala_id, profesional_email, fecha, hora, cupo_inicial, cupo_disponible)
        SELECT z.id, s.id, '{email}', d.fecha, '{hora}'::time, s.cupo, s.cupo
        FROM zonas z
        CROSS JOIN salas s
        CROSS JOIN (VALUES {values_fechas}) AS d(fecha)
        WHERE z.nombre = '{zona}'
          AND s.nombre = '{sala}'
          AND z.activo = true
          AND s.activo = true;
        """)

    # ── 3. Abonos (Carlos, Florencia, Natalia, Romina, Maria, Ana, Sofia) ─────
    op.execute("""
    INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, monto_mensual, dia_limite_pago, estado, activo)
    SELECT u.id, z.id, fi.fecha_inicio::date, z.precio, 10, fi.estado::estado_abono, fi.activo
    FROM (VALUES
        ('carlos.diaz@test.com',       'superior', '2026-06-01', 'activo',   true),
        ('florencia.herrera@test.com', 'medio',    '2026-06-01', 'activo',   true),
        ('natalia.mendez@test.com',    'inferior', '2026-06-01', 'activo',   true),
        ('romina.ortega@test.com',     'superior', '2026-06-01', 'activo',   true),
        ('romina.ortega@test.com',     'medio',    '2026-06-01', 'activo',   true),
        ('maria.garcia@test.com',      'superior', '2026-05-01', 'activo',   true),
        ('ana.rodriguez@test.com',     'medio',    '2026-05-01', 'activo',   true),
        ('sofia.lopez@test.com',       'medio',    '2026-04-01', 'pausado',  false)
    ) AS fi(email, zona, fecha_inicio, estado, activo)
    JOIN usuarios u ON u.email = fi.email
    JOIN zonas    z ON z.nombre = fi.zona
    ON CONFLICT (usuario_id, zona_id) DO NOTHING;
    """)

    # ── 4. Reservas vinculadas a abonos ───────────────────────────────────────
    # Carlos: superior, Marcela Norte L 08:00 (1/6, 8/6, 15/6, 22/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'superior'
        JOIN usuarios u   ON u.email = 'carlos.diaz@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Transferencia'
        WHERE cp.profesional_email = 'marcela.rios@endereza2.com'
          AND cp.hora = '08:00'::time
          AND cp.fecha IN ('2026-06-01','2026-06-08','2026-06-15','2026-06-22')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'superior'
    ON CONFLICT DO NOTHING;
    """)

    # Florencia: medio, Carolina Sur L 13:00 (1/6, 8/6, 15/6, 22/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'medio'
        JOIN usuarios u   ON u.email = 'florencia.herrera@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        WHERE cp.profesional_email = 'carolina.fuentes@endereza2.com'
          AND cp.hora = '13:00'::time
          AND cp.fecha IN ('2026-06-01','2026-06-08','2026-06-15','2026-06-22')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'medio'
    ON CONFLICT DO NOTHING;
    """)

    # Natalia: inferior, Andrea Central M 14:00 (2/6, 9/6, 16/6, 23/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'inferior'
        JOIN usuarios u   ON u.email = 'natalia.mendez@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
        WHERE cp.profesional_email = 'andrea.salinas@endereza2.com'
          AND cp.hora = '14:00'::time
          AND cp.fecha IN ('2026-06-02','2026-06-09','2026-06-16','2026-06-23')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'inferior'
    ON CONFLICT DO NOTHING;
    """)

    # Romina (superior): Marcela Norte V 08:00 (5/6, 12/6, 19/6, 26/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'superior'
        JOIN usuarios u   ON u.email = 'romina.ortega@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        WHERE cp.profesional_email = 'marcela.rios@endereza2.com'
          AND cp.hora = '08:00'::time
          AND cp.fecha IN ('2026-06-05','2026-06-12','2026-06-19','2026-06-26')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'superior'
    ON CONFLICT DO NOTHING;
    """)

    # Romina (medio): Julian Sur M 11:00 (2/6, 9/6, 16/6, 23/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'medio'
        JOIN usuarios u   ON u.email = 'romina.ortega@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        WHERE cp.profesional_email = 'julian.pedraza@endereza2.com'
          AND cp.hora = '11:00'::time
          AND cp.fecha IN ('2026-06-02','2026-06-09','2026-06-16','2026-06-23')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'medio'
    ON CONFLICT DO NOTHING;
    """)

    # Maria: superior, Marcela Norte L 08:00 — junio (futuras) y pasadas asistio (1/6, 8/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'superior'
        JOIN usuarios u   ON u.email = 'maria.garcia@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Transferencia'
        WHERE cp.profesional_email = 'marcela.rios@endereza2.com'
          AND cp.hora = '08:00'::time
          AND cp.fecha IN ('2026-06-01','2026-06-08')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'superior'
    ON CONFLICT DO NOTHING;
    """)

    # Ana: medio, Carolina Sur L 09:00 (1/6, 8/6)
    op.execute("""
    WITH r_ins AS (
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
        SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
        FROM clases_programadas cp
        JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'medio'
        JOIN usuarios u   ON u.email = 'ana.rodriguez@test.com'
        JOIN medios_pago mp ON mp.nombre = 'Efectivo'
        WHERE cp.profesional_email = 'carolina.fuentes@endereza2.com'
          AND cp.hora = '09:00'::time
          AND cp.fecha IN ('2026-06-01','2026-06-08')
        ON CONFLICT DO NOTHING
        RETURNING id, clase_programada_id, usuario_id
    )
    INSERT INTO abono_reservas (abono_id, reserva_id)
    SELECT a.id, r.id
    FROM r_ins r
    JOIN abonos a  ON a.usuario_id = r.usuario_id
    JOIN zonas  z  ON z.id = a.zona_id AND z.nombre = 'medio'
    ON CONFLICT DO NOTHING;
    """)

    # ── 5. Reservas sueltas (sin abono) ───────────────────────────────────────
    # Lucia: medio Julian Sur 11:00 (2/6 conf, 9/6 pendiente) + inferior Andrea Central 14:00 (16/6 conf)
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-06-02'::date, '11:00'::time, 'medio',    'julian.pedraza@endereza2.com',   'confirmada', 'Mercado Pago'),
        ('2026-06-09'::date, '11:00'::time, 'medio',    'julian.pedraza@endereza2.com',   'pendiente',  'Mercado Pago'),
        ('2026-06-16'::date, '14:00'::time, 'inferior', 'andrea.salinas@endereza2.com',   'confirmada', 'Mercado Pago')
    ) AS vals(fecha, hora, zona, email, estado, medio)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha AND cp.hora = vals.hora AND cp.profesional_email = vals.email
    JOIN zonas       z  ON z.id = cp.zona_id AND z.nombre = vals.zona
    JOIN usuarios    u  ON u.email = 'lucia.fernandez@test.com'
    JOIN medios_pago mp ON mp.nombre = vals.medio
    ON CONFLICT DO NOTHING;
    """)

    # Martin: superior Lucas Norte 16:00 (M 2/6 conf, J 4/6 conf, M 9/6 pend)
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, vals.estado::estado_reserva
    FROM (VALUES
        ('2026-06-02'::date, 'confirmada'),
        ('2026-06-04'::date, 'confirmada'),
        ('2026-06-09'::date, 'pendiente')
    ) AS vals(fecha, estado)
    JOIN clases_programadas cp ON cp.fecha = vals.fecha
        AND cp.hora = '16:00'::time
        AND cp.profesional_email = 'lucas.bertoldi@endereza2.com'
    JOIN zonas       z  ON z.id = cp.zona_id AND z.nombre = 'superior'
    JOIN usuarios    u  ON u.email = 'martin.gomez@test.com'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    # Valentina: superior Marcela Norte L 08:00 1/6 pendiente
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, 'pendiente'::estado_reserva
    FROM clases_programadas cp
    JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'superior'
    JOIN usuarios u   ON u.email = 'valentina.torres@test.com'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    WHERE cp.fecha = '2026-06-01'
      AND cp.hora = '08:00'::time
      AND cp.profesional_email = 'marcela.rios@endereza2.com'
    ON CONFLICT DO NOTHING;
    """)

    # ── 6. Llenar cupo de Andrea Central 2026-06-02 14:00 (cupo=4) ────────────
    # Natalia ya esta dentro via abono; sumamos Diego, Camila, Pablo → cupo=0
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
    FROM (VALUES
        ('diego.ibanez@test.com'),
        ('camila.juarez@test.com'),
        ('pablo.lemos@test.com')
    ) AS vals(email)
    JOIN usuarios u ON u.email = vals.email
    JOIN clases_programadas cp ON cp.fecha = '2026-06-02'::date
        AND cp.hora = '14:00'::time
        AND cp.profesional_email = 'andrea.salinas@endereza2.com'
    JOIN zonas       z  ON z.id = cp.zona_id AND z.nombre = 'inferior'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    ON CONFLICT DO NOTHING;
    """)

    # Sergio: reserva en otro slot suelto (Emilio Central V 16:00 5/6 confirmada)
    op.execute("""
    INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, estado)
    SELECT u.id, cp.id, mp.id, z.precio, 'confirmada'::estado_reserva
    FROM clases_programadas cp
    JOIN zonas z ON z.id = cp.zona_id AND z.nombre = 'inferior'
    JOIN usuarios u   ON u.email = 'sergio.nunez@test.com'
    JOIN medios_pago mp ON mp.nombre = 'Efectivo'
    WHERE cp.fecha = '2026-06-05'
      AND cp.hora = '16:00'::time
      AND cp.profesional_email = 'emilio.manrique@endereza2.com'
    ON CONFLICT DO NOTHING;
    """)

    # ── 7. Recalcular cupo_disponible de los slots con reservas activas ───────
    op.execute("""
    UPDATE clases_programadas cp
    SET cupo_disponible = GREATEST(
        0,
        cp.cupo_inicial - sub.cant
    )
    FROM (
        SELECT r.clase_programada_id, COUNT(*) AS cant
        FROM reservas r
        WHERE r.estado NOT IN ('cancelada'::estado_reserva)
        GROUP BY r.clase_programada_id
    ) sub
    WHERE cp.id = sub.clase_programada_id;
    """)

    # ── 8. Pagos de abono (junio pendiente para los activos) ──────────────────
    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 6, '2026-06-10', a.monto_mensual, 'pendiente'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id
    JOIN zonas    z  ON z.id = a.zona_id
    JOIN medios_pago mp ON mp.nombre = CASE u.email
        WHEN 'carlos.diaz@test.com'       THEN 'Transferencia'
        WHEN 'florencia.herrera@test.com' THEN 'Efectivo'
        WHEN 'natalia.mendez@test.com'    THEN 'Mercado Pago'
        WHEN 'romina.ortega@test.com'     THEN 'Efectivo'
        WHEN 'maria.garcia@test.com'      THEN 'Transferencia'
        WHEN 'ana.rodriguez@test.com'     THEN 'Efectivo'
    END
    WHERE u.email IN (
        'carlos.diaz@test.com', 'florencia.herrera@test.com',
        'natalia.mendez@test.com', 'romina.ortega@test.com',
        'maria.garcia@test.com', 'ana.rodriguez@test.com'
    )
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # Maria mayo pagado; Sofia abril pagado + mayo vencido
    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, fecha_pago, monto, estado)
    SELECT a.id, mp.id, 2026, 5, '2026-05-10', '2026-05-08 10:30:00', a.monto_mensual, 'pagado'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'maria.garcia@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'superior'
    JOIN medios_pago mp ON mp.nombre = 'Transferencia'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, fecha_pago, monto, estado)
    SELECT a.id, mp.id, 2026, 4, '2026-04-10', '2026-04-07 09:00:00', a.monto_mensual, 'pagado'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'sofia.lopez@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    op.execute("""
    INSERT INTO pagos_abono (abono_id, medio_pago_id, anio, mes, fecha_vencimiento, monto, estado)
    SELECT a.id, mp.id, 2026, 5, '2026-05-10', a.monto_mensual, 'vencido'::estado_pago_abono
    FROM abonos a
    JOIN usuarios u  ON u.id = a.usuario_id AND u.email = 'sofia.lopez@test.com'
    JOIN zonas    z  ON z.id = a.zona_id    AND z.nombre = 'medio'
    JOIN medios_pago mp ON mp.nombre = 'Mercado Pago'
    ON CONFLICT (abono_id, anio, mes) DO NOTHING;
    """)

    # ── 9. Lista de espera: Andrea Central 2026-06-02 14:00 (cupo lleno) ──────
    op.execute("""
    INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad, estado, activo)
    SELECT u.id, cp.id, vals.prioridad, 'esperando'::estado_lista_espera, true
    FROM (VALUES
        ('romina.ortega@test.com',   1),
        ('lucia.fernandez@test.com', 2)
    ) AS vals(email, prioridad)
    JOIN usuarios u ON u.email = vals.email
    JOIN clases_programadas cp ON cp.fecha = '2026-06-02'::date
        AND cp.hora = '14:00'::time
        AND cp.profesional_email = 'andrea.salinas@endereza2.com'
    ON CONFLICT (usuario_id, clase_programada_id) DO NOTHING;
    """)


def downgrade():
    # Borra todo lo creado por este seed en orden de dependencias.
    test_emails = ", ".join(f"'{e}'" for e in [
        'maria.garcia@test.com', 'ana.rodriguez@test.com', 'laura.martinez@test.com',
        'sofia.lopez@test.com', 'valentina.torres@test.com',
        'carlos.diaz@test.com', 'lucia.fernandez@test.com', 'martin.gomez@test.com',
        'florencia.herrera@test.com', 'diego.ibanez@test.com', 'camila.juarez@test.com',
        'pablo.lemos@test.com', 'natalia.mendez@test.com', 'sergio.nunez@test.com',
        'romina.ortega@test.com',
    ])

    op.execute(f"""
    DELETE FROM lista_espera
    WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN ({test_emails}));

    DELETE FROM abono_reservas
    WHERE abono_id IN (
        SELECT a.id FROM abonos a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE u.email IN ({test_emails})
    );

    DELETE FROM pagos_abono
    WHERE abono_id IN (
        SELECT a.id FROM abonos a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE u.email IN ({test_emails})
    );

    DELETE FROM abonos
    WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN ({test_emails}));

    DELETE FROM reservas
    WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN ({test_emails}));

    DELETE FROM clases_programadas
    WHERE fecha BETWEEN '2026-05-22' AND '2026-07-31';

    DELETE FROM usuarios WHERE email IN ({test_emails});
    """)
