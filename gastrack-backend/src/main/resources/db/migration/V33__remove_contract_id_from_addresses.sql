-- Remove contract_id from addresses (Contract<->Address now only via contract_addresses join table)
-- NOTE: Data was already backfilled into contract_addresses in V28.

-- Drop FK if it exists
ALTER TABLE addresses
    DROP CONSTRAINT IF EXISTS fk_addresses_contract;

-- Drop index if it exists
DROP INDEX IF EXISTS idx_addresses_contract_id;

-- Drop column if it exists
ALTER TABLE addresses
    DROP COLUMN IF EXISTS contract_id;

