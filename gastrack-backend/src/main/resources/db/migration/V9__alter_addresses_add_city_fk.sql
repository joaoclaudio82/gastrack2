-- Alter addresses table to use city_id FK instead of city/state strings

-- Drop old columns (database is empty, no data migration needed)
ALTER TABLE addresses DROP COLUMN IF EXISTS city;
ALTER TABLE addresses DROP COLUMN IF EXISTS state;

-- Add city_id column with FK to cities table
ALTER TABLE addresses ADD COLUMN city_id BIGINT NOT NULL DEFAULT 147;

-- Remove the default after column creation
ALTER TABLE addresses ALTER COLUMN city_id DROP DEFAULT;

-- Add foreign key constraint
ALTER TABLE addresses ADD CONSTRAINT fk_addresses_city
    FOREIGN KEY (city_id) REFERENCES cities(id);

-- Add index for performance
CREATE INDEX idx_addresses_city_id ON addresses(city_id);
