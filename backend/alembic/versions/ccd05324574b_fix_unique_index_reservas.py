"""fix_unique_index_reservas

Revision ID: ccd05324574b
Revises: e1f2a3b4c5d6
Create Date: 2026-06-25 15:00:58.567146

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccd05324574b'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     op.drop_constraint('uq_usuario_clase', 'reservas', type_='unique')
     op.execute("""
        CREATE UNIQUE INDEX uq_usuario_clase_activa 
        ON reservas(usuario_id, clase_programada_id) 
        WHERE estado != 'cancelada'
    """)


def downgrade() -> None:
    op.execute("DROP INDEX uq_usuario_clase_activa")
    op.create_unique_constraint('uq_usuario_clase', 'reservas', ['usuario_id', 'clase_programada_id'])
