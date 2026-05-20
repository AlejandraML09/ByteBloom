"""add_abonos

Revision ID: bbbdd189dd33
Revises: e5f6a7b8c9d0
Create Date: 2026-05-19 18:49:27.513083

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bbbdd189dd33'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    -- ======================================================
    -- ENUMS
    -- ======================================================

    CREATE TYPE estado_abono AS ENUM (
        'activo',
        'vencido',
        'cancelado',
        'pausado'
    );

    CREATE TYPE estado_pago_abono AS ENUM (
        'pendiente',
        'pagado',
        'vencido'
    );

    -- ======================================================
    -- TABLA: abonos
    -- ======================================================

    CREATE TABLE abonos (
        id BIGSERIAL PRIMARY KEY,

        usuario_id BIGINT NOT NULL,

        zona_id BIGINT NOT NULL,

        fecha_inicio DATE NOT NULL
            DEFAULT CURRENT_DATE,

        fecha_fin DATE,

        monto_mensual NUMERIC(10,2)
            NOT NULL
            CHECK (monto_mensual >= 0),

        dia_limite_pago INTEGER NOT NULL
            DEFAULT 10
            CHECK (
                dia_limite_pago BETWEEN 1 AND 31
            ),

        estado estado_abono NOT NULL
            DEFAULT 'activo',

        activo BOOLEAN NOT NULL
            DEFAULT TRUE,

        CONSTRAINT fk_abono_usuario
            FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_abono_zona
            FOREIGN KEY (zona_id)
            REFERENCES zonas(id)
            ON DELETE RESTRICT,

        CONSTRAINT uq_usuario_zona
            UNIQUE (
                usuario_id,
                zona_id
            )
    );

    -- ======================================================
    -- TABLA: pagos_abono
    -- ======================================================

    CREATE TABLE pagos_abono (
        id BIGSERIAL PRIMARY KEY,

        abono_id BIGINT NOT NULL,

        medio_pago_id BIGINT,

        anio INTEGER NOT NULL
            CHECK (anio >= 2025),

        mes INTEGER NOT NULL
            CHECK (
                mes BETWEEN 1 AND 12
            ),

        fecha_vencimiento DATE NOT NULL,

        fecha_pago TIMESTAMP,

        monto NUMERIC(10,2)
            NOT NULL
            CHECK (monto >= 0),

        estado estado_pago_abono
            NOT NULL
            DEFAULT 'pendiente',

        CONSTRAINT fk_pago_abono
            FOREIGN KEY (abono_id)
            REFERENCES abonos(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_pago_medio
            FOREIGN KEY (medio_pago_id)
            REFERENCES medios_pago(id)
            ON DELETE RESTRICT,

        CONSTRAINT uq_abono_mes
            UNIQUE (
                abono_id,
                anio,
                mes
            )
    );

    -- ======================================================
    -- INDICES
    -- ======================================================

    CREATE INDEX idx_abonos_usuario
    ON abonos(usuario_id);

    CREATE INDEX idx_abonos_zona
    ON abonos(zona_id);

    CREATE INDEX idx_abonos_estado
    ON abonos(estado);

    CREATE INDEX idx_pagos_abono
    ON pagos_abono(abono_id);

    CREATE INDEX idx_pagos_abono_estado
    ON pagos_abono(estado);

    CREATE INDEX idx_pagos_abono_periodo
    ON pagos_abono(anio, mes);
    """)


def downgrade():
    op.execute("""
    -- ======================================================
    -- DROP INDEXES
    -- ======================================================

    DROP INDEX IF EXISTS idx_pagos_abono_periodo;
    DROP INDEX IF EXISTS idx_pagos_abono_estado;
    DROP INDEX IF EXISTS idx_pagos_abono;

    DROP INDEX IF EXISTS idx_abonos_estado;
    DROP INDEX IF EXISTS idx_abonos_zona;
    DROP INDEX IF EXISTS idx_abonos_usuario;

    -- ======================================================
    -- DROP TABLES
    -- ======================================================

    DROP TABLE IF EXISTS pagos_abono;

    DROP TABLE IF EXISTS abonos;

    -- ======================================================
    -- DROP ENUMS
    -- ======================================================

    DROP TYPE IF EXISTS estado_pago_abono;

    DROP TYPE IF EXISTS estado_abono;
    """)