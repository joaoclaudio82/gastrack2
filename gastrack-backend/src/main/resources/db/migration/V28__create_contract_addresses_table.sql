-- Create contract_addresses join table to store allowed addresses per contract

CREATE TABLE IF NOT EXISTS contract_addresses (
    contract_id BIGINT NOT NULL,
    address_id BIGINT NOT NULL,
    PRIMARY KEY (contract_id, address_id),
    CONSTRAINT fk_contract_addresses_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_contract_addresses_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contract_addresses_contract_id ON contract_addresses(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_addresses_address_id ON contract_addresses(address_id);

-- Backfill with existing address-to-contract assignments, if any
INSERT INTO contract_addresses (contract_id, address_id)
SELECT contract_id, id
FROM addresses
WHERE contract_id IS NOT NULL
ON CONFLICT DO NOTHING;
