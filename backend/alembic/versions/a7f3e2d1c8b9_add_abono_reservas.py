"""add_abono_reservas

Revision ID: a7f3e2d1c8b9
Revises: d5abe0ee09e5
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a7f3e2d1c8b9"
down_revision: Union[str, Sequence[str], None] = "d5abe0ee09e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    -- ======================================================
    -- TABLA: abono_reservas
    -- Relación entre un abono y sus reservas (máx. 4).
    -- El límite de 4 filas por abono_id se valida en código.
    -- ======================================================

    CREATE TABLE abono_reservas (
        id          BIGSERIAL PRIMARY KEY,

        abono_id    BIGINT NOT NULL,

        reserva_id  BIGINT NOT NULL,

        CONSTRAINT fk_abono_reservas_abono
            FOREIGN KEY (abono_id)
            REFERENCES abonos(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_abono_reservas_reserva
            FOREIGN KEY (reserva_id)
            REFERENCES reservas(id)
            ON DELETE CASCADE,

        CONSTRAINT uq_abono_reserva
            UNIQUE (abono_id, reserva_id)
    );

    -- ======================================================
    -- INDICES
    -- ======================================================

    CREATE INDEX idx_abono_reservas_abono
    ON abono_reservas(abono_id);

    CREATE INDEX idx_abono_reservas_reserva
    ON abono_reservas(reserva_id);
    """)


def downgrade():
    op.execute("""
    DROP INDEX IF EXISTS idx_abono_reservas_reserva;
    DROP INDEX IF EXISTS idx_abono_reservas_abono;
    DROP TABLE IF EXISTS abono_reservas;
    """)