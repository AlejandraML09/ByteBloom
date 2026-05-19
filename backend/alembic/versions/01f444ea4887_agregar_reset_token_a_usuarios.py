"""agregar reset token a usuarios

Revision ID: 01f444ea4887
Revises: e6ea47cca79a
Create Date: 2026-05-19 09:47:50.656934

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '01f444ea4887'
down_revision: Union[str, Sequence[str], None] = 'e6ea47cca79a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('reset_token', sa.String(length=255), nullable=True))
    op.add_column('usuarios', sa.Column('reset_token_expira', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'reset_token_expira')
    op.drop_column('usuarios', 'reset_token')