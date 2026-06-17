"""add_creditos_favor_usuarios

Revision ID: 1c521675f48f
Revises: b2c3d4e5f6a7
Create Date: 2026-06-17 20:35:28.509338

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '1c521675f48f'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('usuarios', sa.Column('creditos_favor', sa.Integer(), nullable=False, server_default='0'))

def downgrade() -> None:
    op.drop_column('usuarios', 'creditos_favor')