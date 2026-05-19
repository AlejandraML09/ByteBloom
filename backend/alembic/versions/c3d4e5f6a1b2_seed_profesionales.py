"""seed profesionales

Revision ID: c3d4e5f6a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c3d4e5f6a1b2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# bcrypt hash of "profesional123"
_PWD = "$2b$12$Y75GaNysdPe2Pso2q6CKju8OAgEe8mIBqF/lVgZg5z0HYTmrug.ti"


def upgrade():
    op.execute(f"""
    INSERT INTO usuarios (email, password, nombre, apellido, fecha_nacimiento, dni, rol)
    VALUES
    ('marcela.rios@endereza2.com',    '{_PWD}', 'Marcela',  'Ríos',      '1985-03-12', 20000001, 'profesional'::rol_usuario),
    ('julian.pedraza@endereza2.com',  '{_PWD}', 'Julián',   'Pedraza',   '1988-07-24', 20000002, 'profesional'::rol_usuario),
    ('andrea.salinas@endereza2.com',  '{_PWD}', 'Andrea',   'Salinas',   '1990-11-05', 20000003, 'profesional'::rol_usuario),
    ('lucas.bertoldi@endereza2.com',  '{_PWD}', 'Lucas',    'Bertoldi',  '1982-02-18', 20000004, 'profesional'::rol_usuario),
    ('carolina.fuentes@endereza2.com','{_PWD}', 'Carolina', 'Fuentes',   '1992-09-30', 20000005, 'profesional'::rol_usuario),
    ('emilio.manrique@endereza2.com', '{_PWD}', 'Emilio',   'Manrique',  '1987-06-08', 20000006, 'profesional'::rol_usuario)
    ON CONFLICT (email) DO NOTHING;
    """)


def downgrade():
    op.execute("""
    DELETE FROM usuarios WHERE email IN (
        'marcela.rios@endereza2.com',
        'julian.pedraza@endereza2.com',
        'andrea.salinas@endereza2.com',
        'lucas.bertoldi@endereza2.com',
        'carolina.fuentes@endereza2.com',
        'emilio.manrique@endereza2.com'
    );
    """)
