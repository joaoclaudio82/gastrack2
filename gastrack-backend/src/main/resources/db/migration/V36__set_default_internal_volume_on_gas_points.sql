UPDATE gas_points
SET internal_volume_liters = 5.000
WHERE internal_volume_liters IS NULL;

ALTER TABLE gas_points
ALTER COLUMN internal_volume_liters SET DEFAULT 5.000;

ALTER TABLE gas_points
ALTER COLUMN internal_volume_liters SET NOT NULL;
