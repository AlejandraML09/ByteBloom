"""seed demo data v3 - reprograma la demo para mañana, usando clases reales existentes

Revision ID: f47a1b2c3d4e
Revises: ccd05324574b
Create Date: 2026-07-02 00:00:00.000000

Reemplaza las reservas/lista de espera/abonos que había dejado la v2
(e1f2a3b4c5d6) para adaptarlas a la nueva fecha de demo, reutilizando:

  - los 3 usuarios demo existentes (leo.demo, nicolasconde204, dolo.demo)
  - clases_programadas REALES ya existentes en esas fechas (no se insertan
    clases nuevas: se buscan de forma flexible por fecha, sin fijarse en
    sala/hora puntuales)

Para los escenarios que necesitan lista de espera, se fuerza
`cupo_disponible = 0` sobre la clase real elegida. Como esto pisa un dato
real, el valor original se guarda en una tabla de respaldo temporal
(`_demo_cupo_backup`) para poder restaurarlo en el downgrade().

Fechas usadas:
  - Día A (>=48h): jueves  2026-07-10
  - Día B (<48h):  viernes 2026-07-03 (día de la demo)
  - Día C (todavía no llegó): miércoles 2026-07-08

  - Dolo "ayer": martes  2026-06-30 (último día de junio)
  - Dolo "hoy":  miércoles 2026-07-01 (primer día de julio)

Escenarios de cancelación (10, sobre Leo):
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

Escenarios de escaneo QR (sobre nicolasconde204):
  - QR inválido            -> no requiere datos, se escanea un token inexistente
  - Abono no activo        -> abono con activo=false, estado='vencido'
  - Fuera de horario       -> reserva confirmada en clase del Día C
  - Ya registró asistencia -> reserva con estado='asistio' (reutiliza clase de Esc6)
  - Reserva cancelada      -> reserva con estado='cancelada' (reutiliza clase de Esc2)
  - Reserva ausente        -> reserva con estado='ausente' (reutiliza clase de Esc4)
  - Asistencia exitosa     -> reserva confirmada en clase nueva del Día B

IMPORTANTE: esta migración necesita que existan AL MENOS 4 clases
programadas el Día A, 5 el Día B, 2 el Día C, y 1 cada día de Dolo. Si no
hay suficientes, el upgrade() corta con una excepción clara en vez de
insertar datos a medias.

NOTA sobre downgrade(): borra las reservas/lista de espera/abono creados
por esta migración, restaura el cupo_disponible original de las clases que
se forzaron a 0, y NO borra ni las clases (son reales) ni los usuarios (se
reutilizaron, no se crearon acá).
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f47a1b2c3d4e"
down_revision: Union[str, Sequence[str], None] = "ccd05324574b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # ---------- 1) LIMPIEZA DE LO QUE DEJÓ LA V2 PARA LOS USUARIOS DEMO ----------
    # No se tocan clases_programadas acá: son reales, no las creó un seed.
    op.execute("""
    DO $$
    DECLARE
        v_user_ids BIGINT[];
    BEGIN
        SELECT array_agg(id) INTO v_user_ids
        FROM usuarios
        WHERE email IN ('leo.demo@test.com', 'nicolasconde204@gmail.com', 'dolo.demo@test.com');

        DELETE FROM resenas
        WHERE reserva_id IN (SELECT id FROM reservas WHERE usuario_id = ANY(v_user_ids));
        
        DELETE FROM abono_reservas
        WHERE abono_id IN (SELECT id FROM abonos WHERE usuario_id = ANY(v_user_ids));
               
        DELETE FROM lista_espera WHERE usuario_id = ANY(v_user_ids);
        DELETE FROM reservas WHERE usuario_id = ANY(v_user_ids);
        DELETE FROM abonos WHERE usuario_id = ANY(v_user_ids);
    END $$;
    """)

    # ---------- 2) RESERVAS NUEVAS SOBRE CLASES REALES EXISTENTES ----------
    op.execute("""
    DO $$
    DECLARE
        -- ---------- EDITAR ACÁ si cambia el día de la demo ----------
        v_fecha_diaA DATE := '2026-07-10';  -- >=48h respecto de la demo
        v_fecha_diaB DATE := '2026-07-03';  -- <48h (mismo día de la demo)
        v_fecha_diaC DATE := '2026-07-08';  -- todavía no llegó al momento del escaneo
        v_fecha_diaD DATE := '2026-07-17';  -- usada solo en el abono de nicolasconde204 (escenario "abono activo")
        v_fecha_diaE DATE := '2026-07-24';  -- usada solo en el abono de nicolasconde204 (escenario "abono activo")
        v_fecha_diaF DATE := '2026-07-31';  -- usada solo en el abono de nicolasconde204 (escenario "abono activo")

        v_fecha_dolo_ayer DATE := '2026-06-30';  -- último día de junio
        v_fecha_dolo_hoy  DATE := '2026-07-01';  -- primer día de julio
        -- -------------------------------------------------------------

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
        v_cl_qr_exito BIGINT;

        v_cl_e9  BIGINT;
        v_cl_e10 BIGINT;

        v_cl_dolo_ayer BIGINT;
        v_cl_dolo_hoy  BIGINT;
        
        v_cl_abono_e1 BIGINT;
        v_cl_abono_e2 BIGINT;
        v_cl_abono_e3 BIGINT;
        v_cl_abono_e4 BIGINT;
        v_cl_abono_e5 BIGINT;

        v_abono_no_activo BIGINT;
        v_abono_activo BIGINT;
        
        -- En DECLARE:
        v_res_abono_e1 BIGINT;
        v_res_abono_e2 BIGINT;
        v_res_abono_e3 BIGINT;
        v_res_abono_e4 BIGINT;
        v_res_abono_e5 BIGINT;
    BEGIN
        SELECT id INTO v_mp_efectivo FROM medios_pago WHERE nombre = 'Efectivo';
        SELECT id INTO v_mp_otro     FROM medios_pago WHERE nombre = 'Mercado Pago';

        -- ---------- REUTILIZAR USUARIOS EXISTENTES ----------
        SELECT id INTO v_user_leo  FROM usuarios WHERE email = 'leo.demo@test.com';
        SELECT id INTO v_user_nico FROM usuarios WHERE email = 'nicolasconde204@gmail.com';
        SELECT id INTO v_user_dolo FROM usuarios WHERE email = 'dolo.demo@test.com';

        IF v_user_leo IS NULL OR v_user_nico IS NULL OR v_user_dolo IS NULL THEN
            RAISE EXCEPTION 'Faltan usuarios demo: verificar leo.demo / nicolasconde204 / dolo.demo';
        END IF;

        -- ---------- BUSCAR CLASES REALES DEL DÍA A (necesita 4, cualquier hora/sala) ----------
        SELECT id INTO v_cl_e1 FROM clases_programadas WHERE fecha = v_fecha_diaA AND hora='16:00:00' AND sala_id=1;
        SELECT id INTO v_cl_e2 FROM clases_programadas WHERE fecha = v_fecha_diaA AND hora='17:00:00' AND sala_id=2;
        SELECT id INTO v_cl_e5 FROM clases_programadas WHERE fecha = v_fecha_diaA AND hora='18:00:00' AND sala_id=1;
        SELECT id INTO v_cl_e6 FROM clases_programadas WHERE fecha = v_fecha_diaA AND hora='19:00:00' AND sala_id=3;

        -- ---------- BUSCAR CLASES REALES DEL DÍA B (necesita 5) ----------
        SELECT id INTO v_cl_e3        FROM clases_programadas WHERE fecha = v_fecha_diaB AND hora='16:00:00' AND sala_id=1;
        SELECT id INTO v_cl_e4        FROM clases_programadas WHERE fecha = v_fecha_diaB AND hora='17:00:00' AND sala_id=2;
        SELECT id INTO v_cl_e7        FROM clases_programadas WHERE fecha = v_fecha_diaB AND hora='18:00:00' AND sala_id=1;
        SELECT id INTO v_cl_e8        FROM clases_programadas WHERE fecha = v_fecha_diaB AND hora='19:00:00' AND sala_id=3;
        SELECT id INTO v_cl_qr_exito  FROM clases_programadas WHERE fecha = v_fecha_diaB AND hora='16:00:00' AND sala_id=3;

        -- ---------- BUSCAR CLASES REALES DEL DÍA C (necesita 2) ----------
        SELECT id INTO v_cl_e9  FROM clases_programadas WHERE fecha = v_fecha_diaC ORDER BY hora LIMIT 1 OFFSET 0;
        SELECT id INTO v_cl_e10 FROM clases_programadas WHERE fecha = v_fecha_diaC ORDER BY hora LIMIT 1 OFFSET 1;

        -- ---------- BUSCAR CLASES REALES DE DOLO (1 por día) ----------
        SELECT id INTO v_cl_dolo_ayer FROM clases_programadas WHERE fecha = v_fecha_dolo_ayer ORDER BY hora LIMIT 1 OFFSET 0;
        SELECT id INTO v_cl_dolo_hoy  FROM clases_programadas WHERE fecha = v_fecha_dolo_hoy  ORDER BY hora LIMIT 1 OFFSET 0;
        
        -- ---------- BUSCAR CLASES REALES PARA EL ABONO (necesita 5) ----------
        SELECT id INTO v_cl_abono_e1 FROM clases_programadas WHERE fecha = v_fecha_diaA AND hora='09:00:00' AND sala_id=2;
        SELECT id INTO v_cl_abono_e2 FROM clases_programadas WHERE fecha = v_fecha_diaB AND hora='09:00:00' AND sala_id=2;
        SELECT id INTO v_cl_abono_e3 FROM clases_programadas WHERE fecha = v_fecha_diaD AND hora='09:00:00' AND sala_id=2;
        SELECT id INTO v_cl_abono_e4 FROM clases_programadas WHERE fecha = v_fecha_diaE AND hora='09:00:00' AND sala_id=2;
        SELECT id INTO v_cl_abono_e5 FROM clases_programadas WHERE fecha = v_fecha_diaF AND hora='09:00:00' AND sala_id=2;

        -- --------- VALIDAR QUE HAYA SUFICIENTES CLASES PARA CADA DÍA ----------

        IF v_cl_e1 IS NULL OR v_cl_e2 IS NULL OR v_cl_e5 IS NULL OR v_cl_e6 IS NULL THEN
            RAISE EXCEPTION 'No hay suficientes clases programadas en el Día A (%): se necesitan 4', v_fecha_diaA;
        END IF;
        IF v_cl_e3 IS NULL OR v_cl_e4 IS NULL OR v_cl_e7 IS NULL OR v_cl_e8 IS NULL OR v_cl_qr_exito IS NULL THEN
            RAISE EXCEPTION 'No hay suficientes clases programadas en el Día B (%): se necesitan 5', v_fecha_diaB;
        END IF;
        IF v_cl_e9 IS NULL OR v_cl_e10 IS NULL THEN
            RAISE EXCEPTION 'No hay suficientes clases programadas en el Día C (%): se necesitan 2', v_fecha_diaC;
        END IF;
        IF v_cl_dolo_ayer IS NULL THEN
            RAISE EXCEPTION 'No hay ninguna clase programada el % para Dolo (ayer)', v_fecha_dolo_ayer;
        END IF;
        IF v_cl_dolo_hoy IS NULL THEN
            RAISE EXCEPTION 'No hay ninguna clase programada el % para Dolo (hoy)', v_fecha_dolo_hoy;
        END IF;
        IF v_cl_abono_e1 IS NULL OR v_cl_abono_e2 IS NULL OR v_cl_abono_e3 IS NULL OR v_cl_abono_e4 IS NULL OR v_cl_abono_e5 IS NULL THEN
            RAISE EXCEPTION 'No hay suficientes clases programadas para el abono de nicolasconde204: se necesitan 5 (una por cada fecha de abono)';
        END IF;

        -- ---------- FORZAR cupo_disponible = 0 EN LAS CLASES CON LISTA DE ESPERA ----------
        -- Se guarda el valor original en una tabla de respaldo para poder
        -- restaurarlo en el downgrade() sin perder el dato real.
        CREATE TABLE IF NOT EXISTS _demo_cupo_backup (
            clase_id BIGINT PRIMARY KEY,
            cupo_disponible INT NOT NULL
        );

        INSERT INTO _demo_cupo_backup (clase_id, cupo_disponible)
        SELECT id, cupo_disponible FROM clases_programadas
        WHERE id IN (v_cl_e1, v_cl_e3, v_cl_e5, v_cl_e7, v_cl_e9)
        ON CONFLICT (clase_id) DO NOTHING;

        UPDATE clases_programadas SET cupo_disponible = 0
        WHERE id IN (v_cl_e1, v_cl_e3, v_cl_e5, v_cl_e7, v_cl_e9);

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

        -- Asistencia exitosa: reserva confirmada en la clase extra del Día B
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_qr_exito, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-fc8b41b79bb0e19c2a5e93f4908c4a16');

        -- "No tenés clase en este horario": reserva confirmada en clase del Día C
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_e10, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-f5f7c986e24cb86b44149021c48cd356');

        -- "La reserva está cancelada": reutiliza v_cl_e2
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_e2, v_mp_efectivo, 5000.00, 5000.00, 'cancelada', 'qr-9a251c99407dab58bee039326c21e788');

        -- "La reserva fue marcada como ausente": reutiliza v_cl_dolo_ayer
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_dolo_ayer, v_mp_otro, 5000.00, 5000.00, 'ausente', 'qr-8517dfb1c5813b9442e1dedaec3f09f1');

        -- "Ya registró asistencia": reutiliza v_cl_dolo_hoy
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_dolo_hoy, v_mp_efectivo, 5000.00, 5000.00, 'asistio', 'qr-fbf2b2f718f9b6a4c0c7b890bd864b1d');

        -- ---------- ABONO DE NICOLASCONDE204 (escenario "abono no activo") ----------
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, fecha_fin, monto_mensual, dia_limite_pago, estado, activo, qr_token)
        VALUES (v_user_nico, 1, '2026-06-01', '2026-06-30', 15000.00, 10, 'vencido', false, 'qr-9a22ca5d19cca26e5f64bbe0d258f046')
        RETURNING id INTO v_abono_no_activo;
        
        -- ---------- ABONO DE NICOLASCONDE204 (escenario "abono activo") ----------
        INSERT INTO abonos (usuario_id, zona_id, fecha_inicio, fecha_fin, monto_mensual, dia_limite_pago, estado, activo, qr_token)
        VALUES (v_user_nico, 1, '2026-07-01', '2026-07-31', 25000.00, 10, 'activo', true, 'qr-4d08f1209371d12c654dfc30b6279810')
        RETURNING id INTO v_abono_activo;
        
        -- --------- RESERVAS DE ABONO ACTIVO DE NICOLASCONDE204 ----------
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_abono_e1, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text))
        RETURNING id INTO v_res_abono_e1;
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_abono_e2, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text))
        RETURNING id INTO v_res_abono_e2;
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_abono_e3, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text))
        RETURNING id INTO v_res_abono_e3;
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_abono_e4, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text))
        RETURNING id INTO v_res_abono_e4;
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user_nico, v_cl_abono_e5, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text))
        RETURNING id INTO v_res_abono_e5;

        -- ---------- VINCULAR CADA RESERVA CON EL ABONO ----------
        INSERT INTO abono_reservas (abono_id, reserva_id) VALUES (v_abono_activo, v_res_abono_e1);
        INSERT INTO abono_reservas (abono_id, reserva_id) VALUES (v_abono_activo, v_res_abono_e2);
        INSERT INTO abono_reservas (abono_id, reserva_id) VALUES (v_abono_activo, v_res_abono_e3);
        INSERT INTO abono_reservas (abono_id, reserva_id) VALUES (v_abono_activo, v_res_abono_e4);
        INSERT INTO abono_reservas (abono_id, reserva_id) VALUES (v_abono_activo, v_res_abono_e5);

    END $$;
    """)


def downgrade():
    op.execute("""
    DO $$
    DECLARE
        v_user_ids BIGINT[];
    BEGIN
        SELECT array_agg(id) INTO v_user_ids
        FROM usuarios
        WHERE email IN ('leo.demo@test.com', 'nicolasconde204@gmail.com', 'dolo.demo@test.com');

        -- Restaurar el cupo_disponible original de las clases reales que se
        -- forzaron a 0 para simular lista de espera.
        UPDATE clases_programadas cp
        SET cupo_disponible = b.cupo_disponible
        FROM _demo_cupo_backup b
        WHERE cp.id = b.clase_id;

        DELETE FROM _demo_cupo_backup;
        DROP TABLE IF EXISTS _demo_cupo_backup;
        
        DELETE FROM resenas
        WHERE reserva_id IN (SELECT id FROM reservas WHERE usuario_id = ANY(v_user_ids));

        DELETE FROM abono_reservas
        WHERE abono_id IN (SELECT id FROM abonos WHERE usuario_id = ANY(v_user_ids));

        DELETE FROM abonos WHERE usuario_id = ANY(v_user_ids);
        DELETE FROM lista_espera WHERE usuario_id = ANY(v_user_ids);
        DELETE FROM reservas WHERE usuario_id = ANY(v_user_ids);

        -- NO se borran las clases (son reales) ni los usuarios (se reutilizaron).
    END $$;
    """)