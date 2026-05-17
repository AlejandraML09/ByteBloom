"""add usuario_id to turnos

Revision ID: a1b2c3d4e5f6
Revises: c602547ab5bb
Create Date: 2026-05-17 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "c602547ab5bb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("turnos", sa.Column("usuario_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_turnos_usuario_id"), "turnos", ["usuario_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_turnos_usuario_id"), table_name="turnos")
    op.drop_column("turnos", "usuario_id")
