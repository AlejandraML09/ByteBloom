"""add monto_total y pack_id a reservas (soporte seña + descuento por pack)

Revision ID: b1c2d3e4f5a6
Revises: a8b9c0d1e2f3
Create Date: 2026-05-23 12:00:00.000000

Agrega las columnas necesarias para:
  - Pago en cuotas tipo seña: `monto_total` guarda el precio acordado
    (con descuento ya aplicado); `precio_pagado` sigue siendo lo cobrado.
    Cuando precio_pagado < monto_total, la reserva queda con pago pendiente.
  - Identificación de pack: `pack_id` agrupa las reservas creadas en la
    misma operación de 2 o 3 clases, para poder verificar ausencias previas
    y decidir si aplica el descuento.

Backfill: para reservas existentes seteamos `monto_total = precio_pagado`
(pago completo, sin pack).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "a8b9c0d1e2f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        ALTER TABLE reservas
            ADD COLUMN monto_total NUMERIC(10, 2);

        UPDATE reservas
        SET monto_total = precio_pagado
        WHERE monto_total IS NULL;

        ALTER TABLE reservas
            ALTER COLUMN monto_total SET NOT NULL;

        ALTER TABLE reservas
            ADD COLUMN pack_id VARCHAR(36);

        CREATE INDEX idx_reservas_pack_id
            ON reservas(pack_id);
    """)


def downgrade():
    op.execute("""
        DROP INDEX IF EXISTS idx_reservas_pack_id;

        ALTER TABLE reservas
            DROP COLUMN IF EXISTS pack_id;

        ALTER TABLE reservas
            DROP COLUMN IF EXISTS monto_total;
    """)
