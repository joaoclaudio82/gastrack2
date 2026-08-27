-- Add contract_id to addresses: one contract can have many addresses, one address at most one contract
ALTER TABLE addresses
    ADD COLUMN contract_id BIGINT NULL,
    ADD CONSTRAINT fk_addresses_contract FOREIGN KEY (contract_id) REFERENCES contracts(id);

CREATE INDEX idx_addresses_contract_id ON addresses(contract_id);
