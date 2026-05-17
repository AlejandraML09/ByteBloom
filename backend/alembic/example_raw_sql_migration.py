"""
Example of a raw SQL migration.
Copy this file into alembic/versions/ and update revision/down_revision before using it.
"""

from alembic import op

# Unique ID for this migration — generate one with: alembic revision
revision = "xxxxxxxxxxxxxxxx"
# Hash of the migration this one builds on top of (run `alembic current` to find it)
down_revision = "yyyyyyyyyyyyyyyy"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE usuarios
        ADD COLUMN telefono VARCHAR(20)
    """)


def downgrade():
    op.execute("""
        ALTER TABLE usuarios
        DROP COLUMN telefono
    """)
