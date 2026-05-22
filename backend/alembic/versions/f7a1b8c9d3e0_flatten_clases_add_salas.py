"""flatten clases_programadas y agregar salas

Revision ID: f7a1b8c9d3e0
Revises: d2e3f4a5b6c7
Create Date: 2026-05-22 12:00:00.000000

Cambios:
  - Elimina la tabla `clases` (plantilla).
  - Crea la tabla `salas` (recurso fisico con cupo propio) + 3 seeds.
  - Aplana `clases_programadas`: ahora guarda zona_id, sala_id, profesional_email,
    cupo_inicial directamente. Quita clase_id.
  - Indices unicos parciales para conflictos de sala y profesional en mismo slot.
  - Borra datos previos (proyecto academico, sin preservar historial).
"""
from typing import Sequence, Union
from alembic import op

revision: str = "f7a1b8c9d3e0"
down_revision: Union[str, Sequence[str], None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    -- ======================================================
    -- 1. Limpiar datos previos (academico: sin preservar)
    -- ======================================================
    DELETE FROM abono_reservas;
    DELETE FROM lista_espera;
    DELETE FROM reservas;
    DELETE FROM clases_programadas;
    DELETE FROM clases;

    -- ======================================================
    -- 2. Crear tabla salas
    -- ======================================================
    CREATE TABLE salas (
        id BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(80) NOT NULL UNIQUE,
        descripcion TEXT,
        cupo INTEGER NOT NULL CHECK (cupo >= 1),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX ix_salas_activo ON salas(activo);

    -- ======================================================
    -- 3. Seed: 3 salas demo
    -- ======================================================
    INSERT INTO salas (nombre, descripcion, cupo) VALUES
        ('Sala Norte',   'Sala equipada para 5 personas máximo', 5),
        ('Sala Sur',     'Sala equipada para 6 personas máximo', 6),
        ('Sala Central', 'Sala equipada para 4 personas máximo', 4);

    -- ======================================================
    -- 4. Aplanar clases_programadas
    -- ======================================================
    ALTER TABLE clases_programadas
        DROP CONSTRAINT IF EXISTS fk_clase_programada_clase;

    DROP INDEX IF EXISTS idx_clases_programadas_clase;

    ALTER TABLE clases_programadas DROP COLUMN clase_id;

    ALTER TABLE clases_programadas
        ADD COLUMN zona_id BIGINT NOT NULL,
        ADD COLUMN sala_id BIGINT NOT NULL,
        ADD COLUMN profesional_email VARCHAR(100),
        ADD COLUMN cupo_inicial INTEGER NOT NULL CHECK (cupo_inicial >= 1);

    ALTER TABLE clases_programadas
        ADD CONSTRAINT fk_clase_programada_zona
            FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_clase_programada_sala
            FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE RESTRICT;

    CREATE INDEX ix_cp_zona_id          ON clases_programadas(zona_id);
    CREATE INDEX ix_cp_sala_id          ON clases_programadas(sala_id);
    CREATE INDEX ix_cp_profesional      ON clases_programadas(profesional_email);

    -- Indices unicos parciales: solo aplican sobre clases activas
    CREATE UNIQUE INDEX uq_cp_sala_fecha_hora
        ON clases_programadas (sala_id, fecha, hora)
        WHERE activo = TRUE;

    CREATE UNIQUE INDEX uq_cp_profesional_fecha_hora
        ON clases_programadas (profesional_email, fecha, hora)
        WHERE activo = TRUE AND profesional_email IS NOT NULL;

    -- ======================================================
    -- 5. Drop tabla clases
    -- ======================================================
    DROP INDEX IF EXISTS idx_clases_zona;
    DROP TABLE clases;
    """)


def downgrade():
    op.execute("""
    -- ======================================================
    -- Reversa minima (no restaura datos)
    -- ======================================================

    -- Recrear tabla clases vacia
    CREATE TABLE clases (
        id BIGSERIAL PRIMARY KEY,
        zona_id BIGINT NOT NULL,
        cupo_maximo INTEGER NOT NULL CHECK (cupo_maximo > 0),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        profesional_email VARCHAR(100),
        CONSTRAINT fk_clases_zona
            FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT
    );
    CREATE INDEX idx_clases_zona ON clases(zona_id);

    -- Revertir clases_programadas
    DROP INDEX IF EXISTS uq_cp_profesional_fecha_hora;
    DROP INDEX IF EXISTS uq_cp_sala_fecha_hora;
    DROP INDEX IF EXISTS ix_cp_profesional;
    DROP INDEX IF EXISTS ix_cp_sala_id;
    DROP INDEX IF EXISTS ix_cp_zona_id;

    -- Vaciar antes de cambiar shape (downgrade reversible minima)
    DELETE FROM abono_reservas;
    DELETE FROM lista_espera;
    DELETE FROM reservas;
    DELETE FROM clases_programadas;

    ALTER TABLE clases_programadas
        DROP CONSTRAINT IF EXISTS fk_clase_programada_zona,
        DROP CONSTRAINT IF EXISTS fk_clase_programada_sala;

    ALTER TABLE clases_programadas
        DROP COLUMN IF EXISTS cupo_inicial,
        DROP COLUMN IF EXISTS profesional_email,
        DROP COLUMN IF EXISTS sala_id,
        DROP COLUMN IF EXISTS zona_id;

    ALTER TABLE clases_programadas ADD COLUMN clase_id BIGINT NOT NULL;
    ALTER TABLE clases_programadas
        ADD CONSTRAINT fk_clase_programada_clase
            FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE CASCADE;
    CREATE INDEX idx_clases_programadas_clase ON clases_programadas(clase_id);

    -- Drop salas
    DROP INDEX IF EXISTS ix_salas_activo;
    DROP TABLE IF EXISTS salas;
    """)
