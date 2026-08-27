-- Equipment Kits table (kits installed at locations)
-- Multi-tenant via contract -> company

CREATE SEQUENCE IF NOT EXISTS equipment_kit_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE equipment_kits (
    id BIGINT NOT NULL DEFAULT nextval('equipment_kit_id_seq'),
    contract_id BIGINT NOT NULL,
    address_id BIGINT,
    kit_code VARCHAR(50) NOT NULL,
    installation_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_equipment_kits_kit_code UNIQUE (kit_code),
    CONSTRAINT fk_equipment_kits_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_equipment_kits_address FOREIGN KEY (address_id) REFERENCES addresses(id),
    CONSTRAINT fk_equipment_kits_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_equipment_kits_status CHECK (status IN ('PENDING', 'INSTALLED', 'MAINTENANCE', 'REMOVED', 'DECOMMISSIONED'))
);

CREATE INDEX idx_equipment_kits_contract_id ON equipment_kits(contract_id);
CREATE INDEX idx_equipment_kits_address_id ON equipment_kits(address_id);
CREATE INDEX idx_equipment_kits_status ON equipment_kits(status);
CREATE INDEX idx_equipment_kits_active ON equipment_kits(active);
