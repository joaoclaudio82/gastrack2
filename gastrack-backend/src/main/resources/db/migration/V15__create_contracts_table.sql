-- Contracts table (company contracts)
-- Multi-tenant via company_id

CREATE SEQUENCE IF NOT EXISTS contract_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE contracts (
    id BIGINT NOT NULL DEFAULT nextval('contract_id_seq'),
    company_id BIGINT NOT NULL,
    contract_number VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    kit_quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_contracts_contract_number UNIQUE (contract_number),
    CONSTRAINT fk_contracts_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_contracts_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_contracts_status CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT chk_contracts_kit_quantity CHECK (kit_quantity > 0),
    CONSTRAINT chk_contracts_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_contracts_company_id ON contracts(company_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_active ON contracts(active);
CREATE INDEX idx_contracts_start_date ON contracts(start_date);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
