-- Crear base de datos y usuario seguro (ejecutar como superusuario)
-- Reemplaza 'edi5_db', 'edi5_user' y 'PASSWORD_SEGURO' según tus necesidades
CREATE DATABASE edi5_db;
CREATE USER edi5_user WITH ENCRYPTED PASSWORD 'PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON DATABASE edi5_db TO edi5_user;
\c edi5_db
GRANT CREATE, CONNECT ON DATABASE edi5_db TO edi5_user;
-- Tabla de departamentos
CREATE TABLE departments (
    id PRIMARY KEY NOT NULL,
    floor INTEGER NOT NULL,
    access_code VARCHAR(20) NOT NULL
);

-- Tabla de usuarios (autenticación propia)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dept_id INTEGER REFERENCES departments(id),
    is_admin BOOLEAN DEFAULT FALSE
);

-- Tabla de recursos (gimnasio, quinchos, salas)
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('GYM', 'QUINCHO', 'SALA'))
);

-- Tabla de reservas
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    res_id INTEGER REFERENCES resources(id),
    dept_id INTEGER REFERENCES departments(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    attendees INTEGER NOT NULL
);

-- Índices y restricciones adicionales
CREATE INDEX idx_reservations_res_id ON reservations(res_id);
CREATE INDEX idx_reservations_dept_id ON reservations(dept_id);

-- Reglas de negocio y triggers pueden agregarse según necesidad
