"""update salas cupo a 30

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-05-29 00:00:00.000000

Actualiza el cupo de todas las salas existentes a 30.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "d9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    UPDATE salas SET cupo = 30;
    """)


def downgrade():
    op.execute("""
    UPDATE salas SET cupo =
        CASE nombre
            WHEN 'Sala Norte'   THEN 5
            WHEN 'Sala Sur'     THEN 6
            WHEN 'Sala Central' THEN 4
        END
    WHERE nombre IN ('Sala Norte', 'Sala Sur', 'Sala Central');
    """)