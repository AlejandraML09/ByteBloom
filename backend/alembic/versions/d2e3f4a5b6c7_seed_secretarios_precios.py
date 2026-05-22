"""seed_secretarios_precios: dos secretarios y precio inicial de zonas

Revision ID: d2e3f4a5b6c7
Revises: a7f3e2d1c8b9
Create Date: 2026-05-22 00:00:00.000000

Cambios:
  - Actualiza el precio de las 3 zonas a $5000
  - Crea 2 usuarios con rol secretario (contraseña: 'prueba')
"""
from typing import Sequence, Union
from alembic import op

revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, Sequence[str], None] = "a7f3e2d1c8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PWD = "$2b$12$GSJXo3ZqON3BXRIOPUZL2ub5AsWlb6yjPzRz8m/bsfxATD.YoNQAW"


def upgrade():
    op.execute("""
    UPDATE zonas SET precio = 5000.00
    WHERE nombre IN ('superior', 'medio', 'inferior');
    """)

    op.execute(f"""
    INSERT INTO usuarios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)
    VALUES
      ('Valeria', 'Soto',   50000001, 'valeria.soto@endereza2.com',   '{PWD}', '1991-06-12', 'secretario'::rol_usuario),
      ('Tomás',   'Reyes',  50000002, 'tomas.reyes@endereza2.com',    '{PWD}', '1988-09-27', 'secretario'::rol_usuario)
    ON CONFLICT (email) DO NOTHING;
    """)


def downgrade():
    op.execute("""
    UPDATE zonas SET precio =
        CASE nombre
            WHEN 'superior' THEN 20000.00
            WHEN 'medio'    THEN 15000.00
            WHEN 'inferior' THEN 30000.00
        END
    WHERE nombre IN ('superior', 'medio', 'inferior');
    """)

    op.execute("""
    DELETE FROM usuarios
    WHERE email IN (
        'valeria.soto@endereza2.com',
        'tomas.reyes@endereza2.com'
    );
    """)