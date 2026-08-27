CREATE SEQUENCE IF NOT EXISTS cylinder_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE cylinders (
    id BIGINT NOT NULL DEFAULT nextval('cylinder_id_seq'),
    address_id BIGINT NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    capacity_bar DECIMAL(10, 2) NOT NULL,
    current_pressure_bar DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    last_reading_at TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_cylinders_device_id UNIQUE (device_id),
    CONSTRAINT uk_cylinders_serial_number UNIQUE (serial_number),
    CONSTRAINT fk_cylinders_address FOREIGN KEY (address_id) REFERENCES addresses(id),
    CONSTRAINT chk_cylinder_status CHECK (status IN ('FULL', 'NORMAL', 'LOW', 'CRITICAL', 'EMPTY', 'UNKNOWN'))
);

CREATE INDEX idx_cylinders_address_id ON cylinders(address_id);
CREATE INDEX idx_cylinders_status ON cylinders(status);
