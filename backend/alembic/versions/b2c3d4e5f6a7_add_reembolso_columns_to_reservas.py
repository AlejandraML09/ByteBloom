"""add reembolso columns to reservas

Revision ID: b2c3d4e5f6a7
Revises: g1h2i3j4k8m9
Create Date: 2026-06-16 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "g1h2i3j4k8m9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        ALTER TABLE reservas ADD COLUMN IF NOT EXISTS reembolso_solicitado BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE reservas ADD COLUMN IF NOT EXISTS reembolso_entregado BOOLEAN NOT NULL DEFAULT false;
    """)


def downgrade():
    op.execute("""
        ALTER TABLE reservas DROP COLUMN IF EXISTS reembolso_solicitado;
        ALTER TABLE reservas DROP COLUMN IF EXISTS reembolso_entregado;
    """)