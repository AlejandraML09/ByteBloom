"""seed reseñas demo

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-06-06 11:00:00.000000

Inserta reseñas de ejemplo para poblar la página de profesionales y el carrusel.
Como no hay usuarios/reservas regulares sembrados, el seed es autocontenido:
crea pacientes demo (@resenas.test), clases pasadas pagadas y, sobre cada una,
una reseña. Es idempotente (se puede correr más de una vez sin duplicar).
"""

from typing import Sequence, Union

from alembic import op

revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# bcrypt hash de "Test1234" (mismo que el seed de profesionales)
_PWD = "$2b$12$.l/4WTnBaCkxSxqayVq5ZOQcCOTMtzeu04xZouhj2mrEb6mN9hsWG"


def upgrade():
    op.execute(f"""
    DO $$
    DECLARE
        v_demo      RECORD;
        v_autor_id  BIGINT;
        v_prof_id   BIGINT;
        v_zona_id   BIGINT;
        v_sala_id   BIGINT;
        v_medio_id  BIGINT;
        v_clase_id  BIGINT;
        v_reserva_id BIGINT;
        v_fecha     DATE;
        v_dni       INTEGER;
    BEGIN
        SELECT id INTO v_zona_id  FROM zonas       ORDER BY id LIMIT 1;
        SELECT id INTO v_sala_id  FROM salas       ORDER BY id LIMIT 1;
        SELECT id INTO v_medio_id FROM medios_pago ORDER BY id LIMIT 1;

        -- Próximo DNI libre (evita colisión con usuarios ya sembrados)
        SELECT COALESCE(MAX(dni), 0) + 1 INTO v_dni FROM usuarios;

        IF v_zona_id IS NULL OR v_sala_id IS NULL OR v_medio_id IS NULL THEN
            RAISE NOTICE 'Faltan zonas/salas/medios_pago; se omite el seed de reseñas.';
            RETURN;
        END IF;

        FOR v_demo IN
            SELECT * FROM (VALUES
              ('marcela.rios@endereza2.com',    'Rodrigo',   'rodrigo.demo@resenas.test',   5, 'Marcela es increíble. Después de mi operación de hombro pensé que no iba a recuperar el movimiento completo. En 3 meses me devolvió la vida.', 40),
              ('marcela.rios@endereza2.com',    'Claudia',   'claudia.demo@resenas.test',   5, 'Muy profesional, explica todo con paciencia y claridad. Se nota que ama lo que hace.', 33),
              ('julian.pedraza@endereza2.com',  'Tomás',     'tomas.demo@resenas.test',     5, 'Me rompí los ligamentos y en 5 meses volví a correr. Julián es un crack, sabe exactamente qué hacer en cada etapa.', 30),
              ('julian.pedraza@endereza2.com',  'Sofía',     'sofia.demo@resenas.test',     5, 'Muy detallista, siempre está al tanto de las últimas técnicas. Mejoré muchísimo.', 25),
              ('andrea.salinas@endereza2.com',  'Néstor',    'nestor.demo@resenas.test',    5, 'Tenía una hernia de disco que me limitaba completamente. Andrea me enseñó a moverme diferente y el dolor desapareció.', 22),
              ('andrea.salinas@endereza2.com',  'Daniela',   'daniela.demo@resenas.test',   5, 'Manos de oro, literalmente. Salgo de cada sesión como nueva persona.', 18),
              ('lucas.bertoldi@endereza2.com',  'Valeria',   'valeria.demo@resenas.test',   4, 'Lucas me ayudó a entender mi cuerpo. Nunca había prestado atención a mi postura y ahora tengo cero dolores.', 15),
              ('lucas.bertoldi@endereza2.com',  'Marcos',    'marcos.demo@resenas.test',    4, 'Las sesiones de Pilates son muy completas y bien explicadas. Muy recomendable.', 12),
              ('carolina.fuentes@endereza2.com','Alberto',   'alberto.demo@resenas.test',   5, 'Tenía epicondilitis desde hace años. Carolina es la primera profesional que realmente me alivió el dolor con el láser.', 9),
              ('carolina.fuentes@endereza2.com','Patricia',  'patricia.demo@resenas.test',  5, 'Puntual, amable y muy eficiente. El tratamiento con ultrasonido fue clave en mi recuperación.', 7),
              ('emilio.manrique@endereza2.com', 'Florencia', 'florencia.demo@resenas.test', 5, 'Mi papá tuvo un ACV y gracias a Emilio recuperó la movilidad del lado derecho. Es un profesional extraordinario.', 5),
              ('emilio.manrique@endereza2.com', 'Ernesto',   'ernesto.demo@resenas.test',   5, 'Paciencia infinita y un método muy sólido. Lo recomiendo con los ojos cerrados.', 3)
            ) AS t(prof_email, autor_nombre, autor_email, rating, comentario, dias_atras)
        LOOP
            -- Profesional (saltar si no existe)
            SELECT id INTO v_prof_id FROM usuarios
              WHERE email = v_demo.prof_email AND rol = 'profesional';
            IF v_prof_id IS NULL THEN
                CONTINUE;
            END IF;

            -- Autor (paciente demo)
            SELECT id INTO v_autor_id FROM usuarios WHERE email = v_demo.autor_email;
            IF v_autor_id IS NULL THEN
                INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
                VALUES (v_demo.autor_nombre, 'Demo', v_dni, v_demo.autor_email, '{_PWD}', DATE '1990-01-01', 'usuario')
                RETURNING id INTO v_autor_id;
                v_dni := v_dni + 1;
            END IF;

            v_fecha := CURRENT_DATE - v_demo.dias_atras;

            -- Clase pasada del profesional
            SELECT id INTO v_clase_id FROM clases_programadas
              WHERE profesional_email = v_demo.prof_email
                AND fecha = v_fecha AND hora = TIME '09:00';
            IF v_clase_id IS NULL THEN
                INSERT INTO clases_programadas
                  (zona_id, sala_id, profesional_email, fecha, hora, cupo_inicial, cupo_disponible, activo)
                VALUES (v_zona_id, v_sala_id, v_demo.prof_email, v_fecha, TIME '09:00', 30, 29, TRUE)
                RETURNING id INTO v_clase_id;
            END IF;

            -- Reserva pagada y asistida
            SELECT id INTO v_reserva_id FROM reservas
              WHERE usuario_id = v_autor_id AND clase_programada_id = v_clase_id;
            IF v_reserva_id IS NULL THEN
                INSERT INTO reservas
                  (usuario_id, clase_programada_id, medio_pago_id, precio_pagado, monto_total, fecha_reserva, estado)
                VALUES (v_autor_id, v_clase_id, v_medio_id, 5000, 5000,
                        (v_fecha - 2)::timestamp, 'asistio')
                RETURNING id INTO v_reserva_id;
            END IF;

            -- Reseña
            INSERT INTO resenas
              (usuario_id, profesional_id, reserva_id, rating, comentario, created_at, updated_at)
            VALUES (v_autor_id, v_prof_id, v_reserva_id, v_demo.rating, v_demo.comentario,
                    (v_fecha::timestamp + INTERVAL '2 hours'),
                    (v_fecha::timestamp + INTERVAL '2 hours'))
            ON CONFLICT (reserva_id) DO NOTHING;
        END LOOP;
    END $$;
    """)


def downgrade():
    # Borra en orden de dependencias. Las clases demo (past, hora 09:00) quedan;
    # son inocuas y evita borrar clases ajenas por error.
    op.execute("""
    DELETE FROM resenas
      WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE '%@resenas.test');
    DELETE FROM reservas
      WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE '%@resenas.test');
    DELETE FROM usuarios WHERE email LIKE '%@resenas.test';
    """)
