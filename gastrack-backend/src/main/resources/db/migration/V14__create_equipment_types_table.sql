-- Equipment Types table (global reference data)
-- Read: all authenticated users
-- Write: SUPER_ADMIN only

CREATE SEQUENCE IF NOT EXISTS equipment_type_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE equipment_types (
    id BIGINT NOT NULL DEFAULT nextval('equipment_type_id_seq'),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_equipment_types_name UNIQUE (name)
);

CREATE INDEX idx_equipment_types_active ON equipment_types(active);

-- Seed common equipment types
INSERT INTO equipment_types (id, name, description, active, created_at, updated_at)
VALUES
    (nextval('equipment_type_id_seq'), 'Sensor de Pressão', 'Sensor para monitoramento de pressão do cilindro', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('equipment_type_id_seq'), 'Sensor de Temperatura', 'Sensor para monitoramento de temperatura ambiente', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('equipment_type_id_seq'), 'Módulo GPS', 'Módulo de rastreamento GPS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('equipment_type_id_seq'), 'Módulo de Comunicação', 'Módulo de comunicação celular/LoRa', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('equipment_type_id_seq'), 'Bateria', 'Bateria de alimentação do kit', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('equipment_type_id_seq'), 'Antena', 'Antena de comunicação', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('equipment_type_id_seq'), 'Gabinete', 'Gabinete de proteção do kit', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
