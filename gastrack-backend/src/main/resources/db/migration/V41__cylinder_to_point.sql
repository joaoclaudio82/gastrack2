-- Fatia 2c: cylinder becomes a physical unit backed by a model; the pressure reading
-- moves from the cylinder to the gas point. cylinders and sensor_cylinder_mappings are
-- empty in production, so schema changes are safe with no backfill.

-- 1) Retire the sensor↔cylinder mapping (0 rows).
DROP TABLE IF EXISTS sensor_cylinder_mappings;

-- 2) Slim down cylinders and link to model + gas point.
--    Dropping device_id/status also drops uk_cylinders_device_id, chk_cylinder_status
--    and idx_cylinders_status automatically.
ALTER TABLE cylinders
    DROP COLUMN device_id,
    DROP COLUMN capacity_bar,
    DROP COLUMN current_pressure_bar,
    DROP COLUMN status,
    DROP COLUMN last_reading_at,
    ADD COLUMN cylinder_model_id BIGINT NOT NULL,
    ADD COLUMN gas_point_id BIGINT,
    ALTER COLUMN address_id DROP NOT NULL;

ALTER TABLE cylinders
    ADD CONSTRAINT fk_cylinders_model FOREIGN KEY (cylinder_model_id) REFERENCES cylinder_models(id),
    ADD CONSTRAINT fk_cylinders_gas_point FOREIGN KEY (gas_point_id) REFERENCES gas_points(id);

CREATE INDEX idx_cylinders_cylinder_model_id ON cylinders(cylinder_model_id);
CREATE INDEX idx_cylinders_gas_point_id ON cylinders(gas_point_id);

-- 3) Gas point gains the pressure reading previously held by the cylinder.
ALTER TABLE gas_points
    ADD COLUMN current_pressure_bar DECIMAL(10, 2),
    ADD COLUMN last_reading_at TIMESTAMP,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    ADD CONSTRAINT chk_gas_point_status CHECK (status IN ('FULL', 'NORMAL', 'LOW', 'CRITICAL', 'EMPTY', 'UNKNOWN'));
