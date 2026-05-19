"""initial schema

Revision ID: 461153e1cd47
Revises: 
Create Date: 2026-05-18 15:31:49.089639

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '461153e1cd47'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
    -- ======================================================
    -- ENUMS
    -- ======================================================

    CREATE TYPE rol_usuario AS ENUM (
        'usuario',
        'admin',
        'secretario'
    );

    CREATE TYPE estado_reserva AS ENUM (
        'pendiente',
        'confirmada',
        'cancelada',
        'asistio',
        'ausente'
    );

    -- ======================================================
    -- TABLA: usuarios
    -- ======================================================

    CREATE TABLE usuarios (
        id BIGSERIAL PRIMARY KEY,

        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,

        dni INTEGER NOT NULL UNIQUE,

        email VARCHAR(100) NOT NULL UNIQUE,

        password TEXT NOT NULL,

        fecha_nacimiento DATE NOT NULL,

        rol rol_usuario NOT NULL
            DEFAULT 'usuario',
               
        reset_token VARCHAR(255),

        reset_token_expira TIMESTAMP WITH TIME ZONE
    );

    -- ======================================================
    -- TABLA: zonas
    -- ======================================================

    CREATE TABLE zonas (
        id BIGSERIAL PRIMARY KEY,

        nombre VARCHAR(50) NOT NULL UNIQUE,

        descripcion TEXT,
    
        precio NUMERIC(10,2) NOT NULL
        CHECK (precio >= 0),

        activo BOOLEAN NOT NULL
            DEFAULT TRUE
    );

    -- ======================================================
    -- TABLA: clases
    -- ======================================================

    CREATE TABLE clases (
        id BIGSERIAL PRIMARY KEY,

        zona_id BIGINT NOT NULL,

        cupo_maximo INTEGER NOT NULL
            CHECK (cupo_maximo > 0),

        activo BOOLEAN NOT NULL
            DEFAULT TRUE,

        profesional_email VARCHAR(100),
               
        CONSTRAINT fk_clases_zona
            FOREIGN KEY (zona_id)
            REFERENCES zonas(id)
            ON DELETE RESTRICT
    );

    -- ======================================================
    -- TABLA: clases_programadas
    -- ======================================================

    CREATE TABLE clases_programadas (
        id BIGSERIAL PRIMARY KEY,

        clase_id BIGINT NOT NULL,

        fecha DATE NOT NULL,

        hora TIME NOT NULL,
               
        cupo_disponible INTEGER NOT NULL
            CHECK (
                cupo_disponible >= 0
            ),

        fecha_creacion TIMESTAMP NOT NULL
            DEFAULT NOW(),

        CONSTRAINT fk_clase_programada_clase
            FOREIGN KEY (clase_id)
            REFERENCES clases(id)
            ON DELETE CASCADE
    );

    -- ======================================================
    -- TABLA: medios_pago
    -- ======================================================

    CREATE TABLE medios_pago (
        id BIGSERIAL PRIMARY KEY,

        nombre VARCHAR(50)
            NOT NULL
            UNIQUE,

        activo BOOLEAN NOT NULL
            DEFAULT TRUE
    );

    -- ======================================================
    -- TABLA: reservas
    -- ======================================================

    CREATE TABLE reservas (
        id BIGSERIAL PRIMARY KEY,

        usuario_id BIGINT NOT NULL,

        clase_programada_id BIGINT NOT NULL,

        medio_pago_id BIGINT NOT NULL,

        precio_pagado NUMERIC(10,2)
            NOT NULL
            CHECK (precio_pagado >= 0),

        fecha_reserva TIMESTAMP NOT NULL
            DEFAULT NOW(),

        estado estado_reserva
            NOT NULL
            DEFAULT 'pendiente',

        CONSTRAINT fk_reserva_usuario
            FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_reserva_clase_programada
            FOREIGN KEY (clase_programada_id)
            REFERENCES clases_programadas(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_reserva_medio_pago
            FOREIGN KEY (medio_pago_id)
            REFERENCES medios_pago(id)
            ON DELETE RESTRICT,

        CONSTRAINT uq_usuario_clase
            UNIQUE (
                usuario_id,
                clase_programada_id
            )
    );

    -- ======================================================
    -- INDICES
    -- ======================================================

    CREATE INDEX idx_usuarios_email
    ON usuarios(email);

    CREATE INDEX idx_usuarios_dni
    ON usuarios(dni);

    CREATE INDEX idx_clases_zona
    ON clases(zona_id);

    CREATE INDEX idx_clases_programadas_fecha
    ON clases_programadas(fecha);

    CREATE INDEX idx_clases_programadas_clase
    ON clases_programadas(clase_id);

    CREATE INDEX idx_reservas_usuario
    ON reservas(usuario_id);

    CREATE INDEX idx_reservas_clase
    ON reservas(clase_programada_id);

    CREATE INDEX idx_reservas_estado
    ON reservas(estado);

    -- ======================================================
    -- DATOS INICIALES
    -- ======================================================

    INSERT INTO zonas (
        nombre,
        descripcion,
        precio
    )
    VALUES
    (
        'superior',
        'Ejercicios de tren superior',
        20000
    ),
    (
        'medio',
        'Ejercicios de core y abdomen',
        15000
    ),
    (
        'inferior',
        'Ejercicios de piernas',
        30000
    );

    INSERT INTO medios_pago (nombre)
    VALUES
    ('Mercado Pago'),
    ('Transferencia'),
    ('Efectivo');

    -- admin default
    INSERT INTO usuarios (
        nombre,
        apellido,
        dni,
        email,
        password,
        fecha_nacimiento,
        rol
    )
    VALUES (
        'Admin',
        'Sistema',
        80808080,
        'admin@endereza2.com',
        '$2b$12$3K2Gx6qJY0b9uKkwM91wh.w0dCiOxlIL/murLtvCkJNnZ4wnSUqzS',
        '1990-01-01',
        'admin'::rol_usuario
    );
    """)


def downgrade():
    op.execute("""
    -- ======================================================
    -- DROP INDEXES
    -- ======================================================

    DROP INDEX IF EXISTS idx_reservas_estado;
    DROP INDEX IF EXISTS idx_reservas_clase;
    DROP INDEX IF EXISTS idx_reservas_usuario;

    DROP INDEX IF EXISTS idx_clases_programadas_clase;
    DROP INDEX IF EXISTS idx_clases_programadas_fecha;

    DROP INDEX IF EXISTS idx_clases_zona;

    DROP INDEX IF EXISTS idx_usuarios_dni;
    DROP INDEX IF EXISTS idx_usuarios_email;

    -- ======================================================
    -- DROP TABLES
    -- Orden correcto por dependencias
    -- ======================================================

    DROP TABLE IF EXISTS reservas;

    DROP TABLE IF EXISTS medios_pago;

    DROP TABLE IF EXISTS clases_programadas;

    DROP TABLE IF EXISTS clases;

    DROP TABLE IF EXISTS zonas;

    DROP TABLE IF EXISTS usuarios;

    -- ======================================================
    -- DROP ENUMS
    -- ======================================================

    DROP TYPE IF EXISTS estado_reserva;

    DROP TYPE IF EXISTS rol_usuario;
    """)


