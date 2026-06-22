"""seed demo data for cancelaciones (usuarios, clases, reservas, lista de espera)

Revision ID: d1e2f3a4b5c6
Revises: c4d5e6f7a8b9
Create Date: 2026-06-18 00:00:00.000000

Carga datos de demo para mostrar el flujo de cancelación de reservas:
3 usuarios demo, 8 clases_programadas (con y sin lista de espera) y
16 reservas que cubren las combinaciones de:
  - tiempo restante hasta la clase en el momento de cancelar (>48h / <48h)
  - medio de pago (efectivo / otro medio)
  - pago completo / seña
  - clase con lista de espera (cupo 0) / sin lista de espera

Las clases "a más de 48h" se programan la semana siguiente (CURRENT_DATE + 7)
y las "a menos de 48h" se programan para mañana (CURRENT_DATE + 1), ambas
calculadas en el momento en que corre la migración.

NOTA: revision_id puesto como placeholder ("cualquier secuencia"), ajustar
según corresponda en tu cadena real de migraciones.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    DO $$
    DECLARE
        -- ---------- EDITAR ACÁ ----------
        v_hora_base   TIME := '12:00:00';     -- primer horario (18:00 y 19:00 se calculan solos)
        -- ---------------------------------

        v_hora1 TIME := v_hora_base;
        v_hora2 TIME := (v_hora_base + INTERVAL '1 hour')::time;
        v_hora3 TIME := (v_hora_base + INTERVAL '2 hours')::time;

        -- "Más de 48 horas" hasta la clase -> la semana siguiente
        v_fecha_mas48   DATE := CURRENT_DATE + INTERVAL '7 days';
        -- "Menos de 48 horas" hasta la clase -> hoy
        v_fecha_menos48 DATE := CURRENT_DATE;

        v_password TEXT := '$2b$12$.l/4WTnBaCkxSxqayVq5ZOQcCOTMtzeu04xZouhj2mrEb6mN9hsWG';

        v_mp_efectivo BIGINT;
        v_mp_otro     BIGINT;

        v_user1 BIGINT; -- Martina Sosa
        v_user2 BIGINT; -- Joaquín Acosta
        v_user3 BIGINT; -- Brenda Ramos
        v_user4 BIGINT; -- Nicolás Conde Martinez (personal, no demo)

        -- Clases CON lista de espera (cupo_disponible = 0)
        v_cl1 BIGINT; -- Sala Norte,   hora1, zona Superior -> >48h, efectivo
        v_cl2 BIGINT; -- Sala Sur,     hora1, zona Medio     -> >48h, otro medio
        v_cl3 BIGINT; -- Sala Norte,   hora2, zona Inferior  -> <48h, efectivo
        v_cl4 BIGINT; -- Sala Sur,     hora2, zona Superior  -> <48h, otro medio

        -- Clases SIN lista de espera (con cupo disponible)
        v_sl1 BIGINT; -- Sala Central, hora1, zona Medio     -> >48h, efectivo
        v_sl2 BIGINT; -- Sala Central, hora2, zona Inferior  -> >48h, otro medio
        v_sl3 BIGINT; -- Sala Central, hora3, zona Superior  -> <48h, efectivo
        v_sl4 BIGINT; -- Sala Norte,   hora3, zona Medio     -> <48h, otro medio
    BEGIN
        SELECT id INTO v_mp_efectivo FROM medios_pago WHERE nombre = 'Efectivo';
        SELECT id INTO v_mp_otro     FROM medios_pago WHERE nombre = 'Mercado Pago';

        -- ---------- USUARIOS DEMO ----------
        INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
        VALUES ('Martina', 'Sosa', 99000001, 'martina.sosa@test.com', v_password, '1995-04-10', 'usuario')
        RETURNING id INTO v_user1;

        INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
        VALUES ('Joaquín', 'Acosta', 99000002, 'joaquin.acosta@test.com', v_password, '1992-08-22', 'usuario')
        RETURNING id INTO v_user2;

        INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
        VALUES ('Brenda', 'Ramos', 99000003, 'brenda.ramos@test.com', v_password, '1998-11-30', 'usuario')
        RETURNING id INTO v_user3;

        -- ---------- USUARIO PERSONAL ----------
        INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
        VALUES ('Nicolás', 'Conde Martinez', 44130204, 'nicolasconde204@gmail.com', v_password, '2002-06-01', 'usuario')
        RETURNING id INTO v_user4;

        ------------------------------
        DELETE FROM lista_espera
        WHERE clase_programada_id IN (
            SELECT id
            FROM clases_programadas
            WHERE fecha IN (v_fecha_mas48, v_fecha_menos48)
            AND hora IN (v_hora1, v_hora2, v_hora3)
        );
               
        DELETE FROM reservas
        WHERE clase_programada_id IN (
            SELECT id
            FROM clases_programadas
            WHERE fecha IN (v_fecha_mas48, v_fecha_menos48)
            AND hora IN (v_hora1, v_hora2, v_hora3)
        );
               
        DELETE FROM clases_programadas
        WHERE fecha IN (v_fecha_mas48, v_fecha_menos48)
          AND hora IN (v_hora1, v_hora2, v_hora3);
        

        -- ---------- CLASES CON LISTA DE ESPERA (cupo_inicial=2, cupo_disponible=0) ----------
        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_mas48, v_hora3, 0, 2, 1, 1) RETURNING id INTO v_cl1;

        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_mas48, v_hora1, 0, 2, 2, 2) RETURNING id INTO v_cl2;

        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_menos48, v_hora2, 0, 2, 3, 1) RETURNING id INTO v_cl3;

        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_menos48, v_hora1, 0, 2, 1, 2) RETURNING id INTO v_cl4;

        -- ---------- CLASES SIN LISTA DE ESPERA (cupo_inicial=10, cupo_disponible=8) ----------
        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_mas48, v_hora1, 8, 10, 2, 3) RETURNING id INTO v_sl1;

        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_mas48, v_hora2, 8, 10, 3, 3) RETURNING id INTO v_sl2;

        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_menos48, v_hora3, 8, 10, 1, 3) RETURNING id INTO v_sl3;

        INSERT INTO clases_programadas (fecha, hora, cupo_disponible, cupo_inicial, zona_id, sala_id)
        VALUES (v_fecha_menos48, v_hora3, 8, 10, 2, 1) RETURNING id INTO v_sl4;

        -- ---------- RESERVAS (16 = todas las combinaciones). estado 'confirmada' para poder cancelarlas en la demo ----------
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user1, v_cl1, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user2, v_cl1, v_mp_efectivo, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user3, v_cl2, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user1, v_cl2, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user2, v_cl3, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user3, v_cl3, v_mp_efectivo, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user1, v_cl4, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user2, v_cl4, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user2, v_sl1, v_mp_efectivo, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user3, v_sl2, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user1, v_sl2, v_mp_otro, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user2, v_sl3, v_mp_efectivo, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));
        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user3, v_sl3, v_mp_efectivo, 2500.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        INSERT INTO reservas (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, estado, qr_token)
        VALUES (v_user1, v_sl4, v_mp_otro, 5000.00, 5000.00, 'confirmada', 'qr-' || md5(random()::text));

        -- ---------- LISTA DE ESPERA (1 persona esperando en cada clase con cupo 0) ----------
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user3, v_cl1, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user2, v_cl2, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user1, v_cl3, 1);
        INSERT INTO lista_espera (usuario_id, clase_programada_id, prioridad) VALUES (v_user4, v_cl4, 1);
    END $$;
    """)


def downgrade():
    demo_emails = (
        "martina.sosa@test.com",
        "joaquin.acosta@test.com",
        "brenda.ramos@test.com",
    )

    # 1) Borra la lista de espera y las reservas de los usuarios demo.
    op.execute(sa.text("""
        DELETE FROM lista_espera
        WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN :emails)
    """).bindparams(sa.bindparam("emails", value=demo_emails, expanding=True)))

    op.execute(sa.text("""
        DELETE FROM reservas
        WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN :emails)
    """).bindparams(sa.bindparam("emails", value=demo_emails, expanding=True)))

    # 2) Borra las clases demo que quedaron sin reservas ni lista de espera.
    #    OJO: se identifican por sala/horario + las mismas fechas relativas
    #    usadas en upgrade(). Si el downgrade corre en un día distinto al
    #    upgrade(), CURRENT_DATE + intervalos puede no coincidir exactamente;
    #    en ese caso, borrar a mano por id.
    op.execute("""
        DELETE FROM clases_programadas cp
        WHERE cp.hora IN ('17:00:00', '18:00:00', '19:00:00')
          AND cp.fecha IN (CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day')
          AND NOT EXISTS (SELECT 1 FROM reservas r WHERE r.clase_programada_id = cp.id)
          AND NOT EXISTS (SELECT 1 FROM lista_espera le WHERE le.clase_programada_id = cp.id)
    """)

    # 3) Borra los usuarios demo.
    op.execute(sa.text("""
        DELETE FROM usuarios WHERE email IN :emails
    """).bindparams(sa.bindparam("emails", value=demo_emails, expanding=True)))