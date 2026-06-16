"""add qr_token to abonos

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-05-30 00:00:00.000000

Agrega columna qr_token a la tabla abonos para identificación única por QR.
Puebla los abonos existentes con un token único.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "abonos",
        sa.Column("qr_token", sa.String(64), nullable=True, unique=True),
    )

    # Poblar abonos existentes con un token único cada uno
    op.execute("""
        UPDATE abonos
        SET qr_token = gen_random_uuid()::text
        WHERE qr_token IS NULL
    """)

    # Una vez poblados todos, hacer la columna obligatoria
    op.alter_column("abonos", "qr_token", nullable=False)


def downgrade():
    op.drop_column("abonos", "qr_token")
def downgrade():
    op.drop_column("abonos", "qr_token")