"""add resenas (reseñas de profesionales)

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-06-06 10:00:00.000000

Crea la tabla `resenas`, que vincula una reseña con:
  - el usuario que la dejó (usuario_id)
  - el profesional reseñado (profesional_id -> usuarios.id, rol='profesional')
  - la reserva sobre la que se hizo (reserva_id, UNIQUE)
"""

from typing import Sequence, Union

from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    CREATE TABLE IF NOT EXISTS resenas (
        id             BIGSERIAL PRIMARY KEY,
        usuario_id     BIGINT NOT NULL REFERENCES usuarios(id),
        profesional_id BIGINT NOT NULL REFERENCES usuarios(id),
        reserva_id     BIGINT NOT NULL REFERENCES reservas(id),
        rating         INTEGER NOT NULL,
        comentario     VARCHAR(1200),
        created_at     TIMESTAMP NOT NULL DEFAULT now(),
        updated_at     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT ck_resena_rating_1_5 CHECK (rating >= 1 AND rating <= 5),
        CONSTRAINT uq_resena_reserva UNIQUE (reserva_id)
    );

    CREATE INDEX IF NOT EXISTS ix_resenas_usuario     ON resenas(usuario_id);
    CREATE INDEX IF NOT EXISTS ix_resenas_profesional ON resenas(profesional_id);
    CREATE INDEX IF NOT EXISTS ix_resenas_reserva     ON resenas(reserva_id);
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS resenas;")
