CREATE SEQUENCE IF NOT EXISTS gas_point_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE gas_points (
    id BIGINT NOT NULL DEFAULT nextval('gas_point_id_seq'),
    address_id BIGINT NOT NULL,
    location VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_gas_points_address FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE INDEX idx_gas_points_address_id ON gas_points(address_id);
CREATE INDEX idx_gas_points_active ON gas_points(active);

