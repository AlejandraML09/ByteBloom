"""seed clases

Revision ID: d4e5f6a1b2c3
Revises: c3d4e5f6a1b2
Create Date: 2026-05-19 16:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d4e5f6a1b2c3"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Two clase templates per zona. WHERE NOT EXISTS keeps this idempotent.
    op.execute("""
    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 8, true, 'marcela.rios@endereza2.com'
    FROM zonas z WHERE z.nombre = 'superior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'marcela.rios@endereza2.com'
          AND c.activo = true
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 8, true, 'carolina.fuentes@endereza2.com'
    FROM zonas z WHERE z.nombre = 'superior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'carolina.fuentes@endereza2.com'
          AND c.activo = true
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 8, true, 'andrea.salinas@endereza2.com'
    FROM zonas z WHERE z.nombre = 'medio'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'andrea.salinas@endereza2.com'
          AND c.activo = true
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 8, true, 'lucas.bertoldi@endereza2.com'
    FROM zonas z WHERE z.nombre = 'medio'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'lucas.bertoldi@endereza2.com'
          AND c.activo = true
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 10, true, 'julian.pedraza@endereza2.com'
    FROM zonas z WHERE z.nombre = 'inferior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'julian.pedraza@endereza2.com'
          AND c.activo = true
    );

    INSERT INTO clases (zona_id, cupo_maximo, activo, profesional_email)
    SELECT z.id, 10, true, 'emilio.manrique@endereza2.com'
    FROM zonas z WHERE z.nombre = 'inferior'
    AND NOT EXISTS (
        SELECT 1 FROM clases c
        WHERE c.zona_id = z.id
          AND c.profesional_email = 'emilio.manrique@endereza2.com'
          AND c.activo = true
    );
    """)


def downgrade():
    op.execute("""
    DELETE FROM clases
    WHERE profesional_email IN (
        'marcela.rios@endereza2.com',
        'carolina.fuentes@endereza2.com',
        'andrea.salinas@endereza2.com',
        'lucas.bertoldi@endereza2.com',
        'julian.pedraza@endereza2.com',
        'emilio.manrique@endereza2.com'
    );
    """)
