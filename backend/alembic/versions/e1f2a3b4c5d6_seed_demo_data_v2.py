"""seed demo data v2 - usuario único para cancelaciones + escenarios de escaneo QR + limpieza del seed anterior

Revision ID: e1f2a3b4c5d6
Revises: d1e2f3a4b5c6
Create Date: 2026-06-24 00:00:00.000000

Reemplaza el seed de la migración anterior (d1e2f3a4b5c6) por un único usuario
demo ("leo.demo@test.com") que reserva y cancela, cubriendo los 10 escenarios
de la HU de cancelación:

  Esc 1: >=48h, pago completo,  lista de espera existente
  Esc 2: >=48h, pago completo,  lista de espera NO existente
  Esc 3: <48h,  pago completo,  lista de espera existente
  Esc 4: <48h,  pago completo,  lista de espera NO existente
  Esc 5: >=48h, pago por seña,  lista de espera existente
  Esc 6: >=48h, pago por seña,  lista de espera NO existente
  Esc 7: <48h,  pago por seña,  lista de espera existente
  Esc 8: <48h,  pago por seña,  lista de espera NO existente
  Esc 9: reserva NO pagada (efectivo), lista de espera existente
  Esc10: reserva NO pagada (efectivo), lista de espera NO existente

El usuario nicolasconde204@gmail.com (creado en la migración anterior) se
reutiliza como la persona en lista de espera en todos los escenarios
"existente" (1, 3, 5, 7, 9), y además recibe reservas/abonos adicionales
para cubrir los escenarios de escaneo de QR (HU de asistencia):

  - QR inválido            -> no requiere datos, se escanea un token inexistente
  - Abono no activo        -> abono con activo=false, estado='vencido'
  - Abono vencido          -> abono con activo=true, estado='activo', fecha_fin pasada
  - Fuera de horario       -> reserva confirmada en clase del Día C (1/7, todavía no llegó)
  - Ya registró asistencia -> reserva con estado='asistio' (reutiliza clase de Esc6)
  - Reserva cancelada      -> reserva con estado='cancelada' (reutiliza clase de Esc2)
  - Reserva ausente        -> reserva con estado='ausente' (reutiliza clase de Esc4)
  - Asistencia exitosa     -> reserva confirmada en clase nueva, viernes 26/6 16h, sala 2

Fechas usadas (fijas, NO relativas a CURRENT_DATE):
  - Día A (>=48h): viernes 2026-07-03
  - Día B (<48h):  viernes 2026-06-26
  - Día C (no aplica anticipación): miércoles 2026-07-01

NOTA sobre downgrade(): solo revierte lo creado por ESTA migración
(usuario leo.demo + sus clases/reservas/lista de espera, y las reservas/
abonos/clase extra agregados para nicolasconde204). No restaura el seed
viejo de Martina/Joaquín/Brenda que esta migración elimina en upgrade().
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # ---------- 1) LIMPIEZA DEL SEED ANTERIOR ----------
    op.execute("""
    DO $$
    DECLARE
        v_old_user_ids  BIGINT[];
        v_old_clase_ids BIGINT[];
    BEGIN
        SELECT array_agg(id) INTO v_old_user_ids
        FROM usuarios
        WHERE email IN ('martina.sosa@test.com', 'joaquin.acosta@test.com', 'brenda.ramos@test.com');

        SELECT array_agg(DISTINCT clase_programada_id) INTO v_old_clase_ids
        FROM reservas
        WHERE usuario_id = ANY(v_old_user_ids);

        DELETE FROM lista_espera WHERE clase_programada_id = ANY(v_old_clase_ids);
        DELETE FROM reservas WHERE usuario_id = ANY(v_old_user_ids);
        DELETE FROM clases_programadas WHERE id = ANY(v_old_clase_ids);
        DELETE FROM usuarios WHERE id = ANY(v_old_user_ids);
    END $$;
    """)

    # ---------- 2) SEED NUEVO: usuario único + 10 escenarios + escaneo QR ----------
    op.execute("""
    DO $$
    DECLARE
        v_fecha_diaA DATE := '2026-07-03';  -- viernes que viene, >=48h
        v_fecha_diaB DATE := '2026-06-26';  -- este viernes, <48h
        v_fecha_diaC DATE := '2026-07-01';  -- miércoles que viene, no aplica anticipación

        v_h16 TIME := '16:00:00';
        v_h17 TIME := '17:00:00';
        v_h18 TIME := '18:00:00';
        v_h19 TIME := '19:00:00';

        v_password TEXT := '$2b$12$.l/4WTnBaCkxSxqayVq5ZOQcCOTMtzeu04xZouhj2mrEb6mN9hsWG';

        v_mp_efectivo BIGINT;
        v_mp_otro     BIGINT;

        v_user_leo  BIGINT;
        v_user_nico BIGINT;
        v_user_dolo BIGINT;

        v_cl_e1  BIGINT;
        v_cl_e2  BIGINT;
        v_cl_e5  BIGINT;
        v_cl_e6  BIGINT;

        v_cl_e3  BIGINT;
        v_cl_e4  BIGINT;
        v_cl_e7  BIGINT;
        v_cl_e8  BIGINT;

        v_cl_e9  BIGINT;
        v_cl_e10 BIGINT;

        -- Clase nueva, solo para el escaneo exitoso de nico
        v_cl_qr_exito BIGINT;

        -- Abonos de nico para los escenarios de escaneo
        v_abono_no_activo BIGINT;
        v_abono_vencido   BIGINT;
               
        v_cl_dolo_ayer BIGINT;
        v_cl_dolo_hoy  BIGINT;

    BEGIN
        SELECT id INTO v_mp_efectivo FROM medios_pago WHERE nombre = 'Efectivo';
        SELECT id INTO v_mp_otro     FROM medios_pago WHERE nombre = 'Mercado Pago';

        SELECT id INTO v_user_nico FROM usuarios WHERE email = 'nicolasconde204@gmail.com';

        -- ---------- USUARIO DEMO ÚNICO ----------
        INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
        VALUES ('Leo', 'Demo', 99000099, 'leo.demo@test.com', v_password, '2000-01-01', 'usuario')
        RETURNING id INTO v_user_leo;
        
        INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
        VALUES ('Dolo', 'Demo', 99000098, 'dolo.demo@test.com', v_password, '2000-01-01', 'usuario')
        RETURNING id INTO v_user_dolo;

        -- ---------- DÍA A (2026-07-03, >=48h) ----------
        SELECT id INTO v_cl_e1
        FROM clases_programadas
        WHERE fecha='2026-07-03'
        AND hora='16:00:00'
        AND sala_id=1;

        SELECT id INTO v_cl_e2
        FROM clases_programadas
        WHERE fecha='2026-07-03'
        AND hora='17:00:00'
        AND sala_id=2;

        SELECT id INTO v_cl_e5
        FROM clases_programadas
        WHERE fecha='2026-07-03'
        AND hora='18:00:00'
        AND sala_id=1;

        SELECT id INTO v_cl_e6
        FROM clases_programadas
        WHERE fecha='2026-07-03'
        AND hora='19:00:00'
        AND sala_id=2;

        -- ---------- DÍA B (2026-06-26, <48h) ----------
        SELECT id INTO v_cl_e3
        FROM clases_programadas
        WHERE fecha='2026-06-26'
        AND hora='16:00:00'
        AND sala_id=1;

        SELECT id INTO v_cl_e4
        FROM clases_programadas
        WHERE fecha='2026-06-26'
        AND hora='17:00:00'
        AND sala_id=2;

        SELECT id INTO v_cl_e7
        FROM clases_programadas
        WHERE fecha='2026-06-26'
        AND hora='18:00:00'
        AND sala_id=3;

        SELECT id INTO v_cl_e8
        FROM clases_programadas
        WHERE fecha='2026-06-26'
        AND hora='19:00:00'
        AND sala_id=3;

        -- ---------- DÍA C (2026-07-01, reserva no pagada) ----------
        SELECT id INTO v_cl_e9
        FROM clases_programadas
        WHERE fecha='2026-07-01'
        AND hora='16:00:00'
        AND sala_id=1;

        SELECT id INTO v_cl_e10
        FROM clases_programadas
        WHERE fecha='2026-07-01'
        AND hora='17:00:00'
        AND sala_id=2;

        -- ---------- CLASE EXTRA: solo para el escaneo exitoso de nico ----------
        -- Mismo día/hora que v_cl_e3 (viernes 26/6 16h) pero sala/zona distinta,
        -- para no interferir con la lista de espera del Escenario 1.
        SELECT id
        INTO v_cl_qr_exito
        FROM clases_programadas
        WHERE fecha='2026-06-26'
        AND hora='16:00:00'
        AND sala_id=2;
               
        -- ---------- RESERVAS DE LEO.DEMO (1 por escenario de cancelación) ----------
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e1, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e2, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e5, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e6, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e3, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e4, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e7, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e8, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e9, v_mp_efectivo, 0.00, 5000.00, 'pendiente', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_leo, v_cl_e10, v_mp_efectivo, 0.00, 5000.00, 'pendiente', 'qr-' || md5(random()::text));
               
        -- ---------- RESERVAS HISTÓRICAS DE DOLO.DEMO ----------

        SELECT id
        INTO v_cl_dolo_ayer
        FROM clases_programadas
        WHERE fecha = '2026-06-23'
        AND hora = '16:00:00'
        AND sala_id = 1;

        SELECT id
        INTO v_cl_dolo_hoy
        FROM clases_programadas
        WHERE fecha = '2026-06-24'
        AND hora = '17:00:00'
        AND sala_id = 2;
               
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_dolo, v_cl_dolo_ayer, v_mp_efectivo, 5000.00, 5000.00, 'asistio', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_dolo, v_cl_dolo_hoy, v_mp_efectivo, 5000.00, 5000.00, 'asistio', 'qr-' || md5(random()::text));

        -- ---------- LISTA DE ESPERA (nicolasconde204 en cada escenario "existente") ----------
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user_nico, v_cl_e1, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user_nico, v_cl_e3, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user_nico, v_cl_e5, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user_nico, v_cl_e7, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user_nico, v_cl_e9, 1);

        -- ---------- RESERVAS ADICIONALES DE NICOLASCONDE204 (escenarios de escaneo QR) ----------

        -- Asistencia exitosa: reserva confirmada en la clase extra de "ahora" (viernes 26/6 16h)
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_qr_exito, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        -- "No tenés clase en este horario": reserva confirmada en clase del Día C (1/7),
        -- que todavía no llegó al momento del escaneo. Reutiliza v_cl_e10.
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_e10, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        -- "La reserva está cancelada": reutiliza v_cl_e2 (fecha/hora no importa, el estado corta antes)
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_e2, v_mp_efectivo, 5000.00, 5000.00, 'cancelada', 'qr-' || md5(random()::text));

        -- "La reserva fue marcada como ausente": reutiliza v_cl_e4
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_e4, v_mp_otro, 5000.00, 5000.00, 'ausente', 'qr-' || md5(random()::text));

        -- "Ya registró asistencia": reutiliza v_cl_e6
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_e6, v_mp_efectivo, 5000.00, 5000.00, 'asistio', 'qr-' || md5(random()::text));

        -- ---------- ABONOS DE NICOLASCONDE204 (escenarios de escaneo QR) ----------

        -- "El abono está vencido": activo=false, estado='vencido'
        -- (cualquier estado != 'activo' corta antes de mirar fecha_fin)
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, fecha_fin, monto_mensual, dia_limite_pago, estado, activo, qr_token)
        VALUES (v_user_nico, 1, '2026-05-01', '2026-05-31', 15000.00, 10, 'vencido', false, 'qr-' || md5(random()::text))
        RETURNING id INTO v_abono_no_activo;
        
    END $$;
    """)


def downgrade():
    op.execute("""
    DO $$
    DECLARE
        v_leo_id         BIGINT;
        v_nico_id        BIGINT;
        v_dolo_id        BIGINT;
        v_clase_ids      BIGINT[];
        v_clase_qr_exito BIGINT;
    BEGIN
        SELECT id INTO v_leo_id  FROM usuarios WHERE email = 'leo.demo@test.com';
        SELECT id INTO v_nico_id FROM usuarios WHERE email = 'nicolasconde204@gmail.com';
        SELECT id INTO v_dolo_id FROM usuarios WHERE email = 'dolo.demo@test.com';

        SELECT array_agg(DISTINCT clase_programada_id) INTO v_clase_ids
        FROM reservas
        WHERE usuario_id = v_leo_id;

        -- Única clase no compartida con leo.demo: la creada para el escaneo exitoso de nico.
        SELECT id INTO v_clase_qr_exito
        FROM clases_programadas
        WHERE fecha = '2026-06-26' AND hora = '16:00:00' AND sala_id = 2;

        -- Abonos de nico (cascada a abono_reservas)
        DELETE FROM abonos WHERE usuario_id = v_nico_id;

        -- Reservas de nico ligadas a los escenarios de escaneo
        DELETE FROM reservas
        WHERE usuario_id = v_nico_id
          AND (clase_programada_id = ANY(v_clase_ids) OR clase_programada_id = v_clase_qr_exito);

        -- Lista de espera + reservas + clases de leo.demo
        DELETE FROM lista_espera WHERE clase_programada_id = ANY(v_clase_ids);
        DELETE FROM reservas WHERE usuario_id IN (v_leo_id, v_nico_id, v_dolo_id)
        AND (
            clase_programada_id = ANY(v_clase_ids)
            OR clase_programada_id = v_clase_qr_exito
        );

        DELETE FROM abonos
        WHERE usuario_id = v_nico_id;

        DELETE FROM usuarios WHERE id = v_leo_id;
    END $$;
    """)