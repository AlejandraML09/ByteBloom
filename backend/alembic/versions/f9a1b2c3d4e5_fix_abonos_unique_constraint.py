"""fix_abonos_unique_constraint

Revision ID: f9a1b2c3d4e5
Revises: bbbdd189dd33
Create Date: 2026-05-23 00:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = 'f9a1b2c3d4e5'
down_revision = 'bbbdd189dd33'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE abonos
        DROP CONSTRAINT IF EXISTS uq_usuario_zona;

        CREATE UNIQUE INDEX uq_abonos_usuario_zona_activo
        ON abonos(usuario_id, zona_id)
        WHERE activo = true;
    """)


def downgrade():
    op.execute("""
        DROP INDEX IF EXISTS uq_abonos_usuario_zona_activo;

        ALTER TABLE abonos
        ADD CONSTRAINT uq_usuario_zona UNIQUE (usuario_id, zona_id);
    """)
