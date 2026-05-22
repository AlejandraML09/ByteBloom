"""add_waiting_list

Revision ID: d5abe0ee09e5
Revises: bbbdd189dd33
Create Date: 2026-05-20 10:04:13.980172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5abe0ee09e5'
down_revision: Union[str, Sequence[str], None] = 'bbbdd189dd33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    -- ======================================================
    -- ENUM
    -- ======================================================

    CREATE TYPE estado_lista_espera AS ENUM (
        'esperando',
        'notificado',
        'confirmado',
        'expirado',
        'cancelado'
    );

    -- ======================================================
    -- TABLA: lista_espera
    -- ======================================================

    CREATE TABLE lista_espera (
        id BIGSERIAL PRIMARY KEY,

        usuario_id BIGINT NOT NULL,

        clase_programada_id BIGINT NOT NULL,

        prioridad INTEGER NOT NULL,

        fecha_inscripcion TIMESTAMP NOT NULL
            DEFAULT NOW(),

        estado estado_lista_espera
            NOT NULL
            DEFAULT 'esperando',

        notificado_en TIMESTAMP,

        expira_en TIMESTAMP,

        activo BOOLEAN NOT NULL
            DEFAULT TRUE,

        CONSTRAINT fk_lista_espera_usuario
            FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_lista_espera_clase
            FOREIGN KEY (clase_programada_id)
            REFERENCES clases_programadas(id)
            ON DELETE CASCADE,

        -- evita anotarse dos veces
        CONSTRAINT uq_usuario_lista
            UNIQUE (
                usuario_id,
                clase_programada_id
            )
    );

    -- ======================================================
    -- INDICES
    -- ======================================================

    CREATE INDEX idx_lista_espera_usuario
    ON lista_espera(usuario_id);

    CREATE INDEX idx_lista_espera_clase
    ON lista_espera(clase_programada_id);

    CREATE INDEX idx_lista_espera_estado
    ON lista_espera(estado);

    CREATE INDEX idx_lista_espera_prioridad
    ON lista_espera(clase_programada_id, prioridad);
    """)


def downgrade():
    op.execute("""
    -- ======================================================
    -- DROP INDEXES
    -- ======================================================

    DROP INDEX IF EXISTS idx_lista_espera_prioridad;

    DROP INDEX IF EXISTS idx_lista_espera_estado;

    DROP INDEX IF EXISTS idx_lista_espera_clase;

    DROP INDEX IF EXISTS idx_lista_espera_usuario;

    -- ======================================================
    -- DROP TABLE
    -- ======================================================

    DROP TABLE IF EXISTS lista_espera;

    -- ======================================================
    -- DROP ENUM
    -- ======================================================

    DROP TYPE IF EXISTS estado_lista_espera;
    """)