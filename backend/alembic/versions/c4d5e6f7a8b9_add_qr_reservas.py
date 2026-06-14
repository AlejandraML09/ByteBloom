"""add qr_token to reservas

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-05-30 00:00:00.000000

Agrega columna qr_token a la tabla reservas para reservas sueltas.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b3c4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "reservas",
        sa.Column("qr_token", sa.String(64), nullable=True, unique=True),
    )

    op.execute("""
        UPDATE reservas
        SET qr_token = gen_random_uuid()::text
        WHERE qr_token IS NULL
    """)

    op.alter_column("reservas", "qr_token", nullable=False)


def downgrade():
    op.drop_column("reservas", "qr_token")