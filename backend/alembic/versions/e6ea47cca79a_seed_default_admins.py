"""seed default admins

Revision ID: e6ea47cca79a
Revises: 461153e1cd47
Create Date: 2026-05-18 15:55:09.159327

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6ea47cca79a'
down_revision: Union[str, Sequence[str], None] = '461153e1cd47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    INSERT INTO usuarios (
        email,
        password,
        nombre,
        apellido,
        fecha_nacimiento,
        dni,
        rol
    )
    VALUES
    (
        'jose@endereza2.com',
        '$2b$12$3K2Gx6qJY0b9uKkwM91wh.w0dCiOxlIL/murLtvCkJNnZ4wnSUqzS',
        'Jose',
        'Pepe',
        '1990-01-15',
        '12345679',
        'admin'::rol_usuario
    ),
    (
        'laura@endereza2.com',
        '$2b$12$3K2Gx6qJY0b9uKkwM91wh.w0dCiOxlIL/murLtvCkJNnZ4wnSUqzS',
        'Laura',
        'Gonzalez',
        '1992-03-20',
        '87654321',
        'admin'::rol_usuario
    )
    ON CONFLICT (email)
    DO NOTHING;
    """)


def downgrade():
    op.execute("""
    DELETE FROM usuarios
    WHERE email IN (
        'jose@endereza2.com',
        'laura@endereza2.com'
    );
    """)