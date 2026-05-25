"""add credito_favor medio de pago

Revision ID: c7d8e9f0a1b2
Revises: b1c2d3e4f5a6
Create Date: 2026-05-25 12:55:00.000000

Agrega el medio de pago `credito_favor` a la tabla medios_pago
para permitir reservas utilizando créditos acumulados por el usuario.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        INSERT INTO medios_pago (nombre, activo)
        VALUES ('Crédito a favor', true);
    """)


def downgrade():
    op.execute("""
        DELETE FROM medios_pago
        WHERE nombre = 'Crédito a favor';
    """)