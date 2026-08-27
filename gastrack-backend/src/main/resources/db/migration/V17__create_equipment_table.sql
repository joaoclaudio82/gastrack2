-- Equipment table (global inventory)
-- Created by SUPER_ADMIN only
-- Visible to ADMIN/USER only for equipment in their company's kits

CREATE SEQUENCE IF NOT EXISTS equipment_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE equipment (
    id BIGINT NOT NULL DEFAULT nextval('equipment_id_seq'),
    equipment_kit_id BIGINT,
    equipment_type_id BIGINT NOT NULL,
    asset_tag VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    purchase_url VARCHAR(500),
    purchase_date DATE,
    warranty_expiration_date DATE,
    condition VARCHAR(20) NOT NULL DEFAULT 'NEW',
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_equipment_asset_tag UNIQUE (asset_tag),
    CONSTRAINT fk_equipment_kit FOREIGN KEY (equipment_kit_id) REFERENCES equipment_kits(id),
    CONSTRAINT fk_equipment_type FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    CONSTRAINT fk_equipment_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_equipment_condition CHECK (condition IN ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'RETIRED'))
);

CREATE INDEX idx_equipment_kit_id ON equipment(equipment_kit_id);
CREATE INDEX idx_equipment_type_id ON equipment(equipment_type_id);
CREATE INDEX idx_equipment_condition ON equipment(condition);
CREATE INDEX idx_equipment_active ON equipment(active);
CREATE INDEX idx_equipment_serial_number ON equipment(serial_number);
