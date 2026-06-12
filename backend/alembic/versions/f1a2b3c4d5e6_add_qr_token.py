"""add qr_token to abonos

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-05-30 00:00:00.000000

Agrega columna qr_token a la tabla abonos para identificación única por QR.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "abonos",
        sa.Column("qr_token", sa.String(64), nullable=True, unique=True),
    )

"""add qr_token to abonos

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-05-30 00:00:00.000000

Agrega columna qr_token a la tabla abonos para identificación única por QR.
Puebla los abonos existentes con un token único.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
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