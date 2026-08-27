-- Fatia 2a: catalog of cylinder types/models. Additive, no backfill, does not touch cylinders.
CREATE SEQUENCE IF NOT EXISTS cylinder_model_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE cylinder_models (
    id BIGINT PRIMARY KEY DEFAULT nextval('cylinder_model_id_seq'),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    gas_type VARCHAR(20) NOT NULL,
    water_volume_liters DECIMAL(10, 2) NOT NULL,
    capacity_bar DECIMAL(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cylinder_model_gas_type CHECK (gas_type IN ('GN', 'O2', 'N2', 'CO2', 'AR_COMP'))
);

CREATE INDEX idx_cylinder_models_gas_type ON cylinder_models(gas_type);
