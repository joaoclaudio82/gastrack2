-- =====================================================
-- V20: Create kit_installations table
-- =====================================================
-- Tracks installation history for equipment kits.
-- Records when kits are installed, uninstalled, or relocated.
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS kit_installation_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE kit_installations (
    id BIGINT PRIMARY KEY DEFAULT nextval('kit_installation_id_seq'),
    kit_id BIGINT NOT NULL REFERENCES equipment_kits(id),
    address_id BIGINT NOT NULL REFERENCES addresses(id),
    operation_type VARCHAR(30) NOT NULL,
    performed_by BIGINT REFERENCES users(id),
    operation_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_kit_installation_operation_type CHECK (operation_type IN ('INSTALLED', 'UNINSTALLED', 'RELOCATED'))
);

CREATE INDEX idx_kit_installations_kit_id ON kit_installations(kit_id);
CREATE INDEX idx_kit_installations_address_id ON kit_installations(address_id);
CREATE INDEX idx_kit_installations_operation_date ON kit_installations(operation_date);
