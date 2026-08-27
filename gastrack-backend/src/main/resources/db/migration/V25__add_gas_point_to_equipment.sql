ALTER TABLE equipment
    ADD COLUMN gas_point_id BIGINT;

ALTER TABLE equipment
    ADD CONSTRAINT fk_equipment_gas_point
        FOREIGN KEY (gas_point_id) REFERENCES gas_points(id);

CREATE INDEX idx_equipment_gas_point_id ON equipment(gas_point_id);

