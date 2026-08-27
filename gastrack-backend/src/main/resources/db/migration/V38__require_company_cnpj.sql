-- Backfill CNPJ for legacy companies (e.g. gastrack-default from V19) before NOT NULL constraint.
-- Derives a deterministic, format-valid placeholder from the id encoded as 14 digits,
-- so the value never overflows VARCHAR(18) nor the request CNPJ pattern, and stays unique per id.
-- NOTE: these are synthetic placeholders (no valid check digits) and should be corrected by operations.
UPDATE companies
SET cnpj = REGEXP_REPLACE(
        LPAD(id::text, 14, '0'),
        '^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$',
        '\1.\2.\3/\4-\5'
    )
WHERE cnpj IS NULL OR TRIM(cnpj) = '';

ALTER TABLE companies ALTER COLUMN cnpj SET NOT NULL;
