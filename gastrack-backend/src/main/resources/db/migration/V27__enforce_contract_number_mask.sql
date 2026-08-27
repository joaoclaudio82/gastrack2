-- Backfill existing contract numbers to match the new CRT-{ddMMyyyy}-{ID} format
UPDATE contracts
SET contract_number = 'CRT-' || TO_CHAR(start_date, 'DDMMYYYY') || '-' || id;

-- Function to enforce the contract number mask before inserts/updates
CREATE OR REPLACE FUNCTION set_contract_number_mask()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.start_date IS NULL THEN
        RAISE EXCEPTION 'start_date is required to generate contract number';
    END IF;

    IF NEW.id IS NULL THEN
        RAISE EXCEPTION 'id must be assigned before generating contract number';
    END IF;

    NEW.contract_number := 'CRT-' || TO_CHAR(NEW.start_date, 'DDMMYYYY') || '-' || NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_number_mask ON contracts;

CREATE TRIGGER trg_contract_number_mask
BEFORE INSERT OR UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION set_contract_number_mask();
