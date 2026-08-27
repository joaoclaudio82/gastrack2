ALTER TABLE gas_points
ADD COLUMN full_tank_pressure_bar NUMERIC(10,3);

UPDATE gas_points
SET full_tank_pressure_bar = 140.000
WHERE full_tank_pressure_bar IS NULL;

ALTER TABLE gas_points
ALTER COLUMN full_tank_pressure_bar SET DEFAULT 140.000;

ALTER TABLE gas_points
ALTER COLUMN full_tank_pressure_bar SET NOT NULL;
