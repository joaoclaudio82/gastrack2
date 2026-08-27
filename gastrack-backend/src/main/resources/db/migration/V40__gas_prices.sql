-- Fatia 2b: versioned, append-only gas prices per (company x gas_type). Additive.
CREATE SEQUENCE IF NOT EXISTS gas_price_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE gas_prices (
    id BIGINT PRIMARY KEY DEFAULT nextval('gas_price_id_seq'),
    company_id BIGINT NOT NULL,
    gas_type VARCHAR(20) NOT NULL,
    price_per_m3 DECIMAL(12, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    valid_from TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gas_prices_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT chk_gas_prices_gas_type CHECK (gas_type IN ('GN', 'O2', 'N2', 'CO2', 'AR_COMP'))
);

CREATE INDEX idx_gas_prices_lookup ON gas_prices(company_id, gas_type, valid_from DESC);
