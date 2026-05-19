"""add profesional to rol_usuario and activo to clases_programadas

Revision ID: a1b2c3d4e5f6
Revises: e6ea47cca79a
Create Date: 2026-05-19 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e6ea47cca79a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'profesional';

    ALTER TABLE clases_programadas
        ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
    """)


def downgrade():
    op.execute("""
    -- PostgreSQL does not support removing enum values; skipping rol_usuario rollback.
    ALTER TABLE clases_programadas DROP COLUMN IF EXISTS activo;
    """)
