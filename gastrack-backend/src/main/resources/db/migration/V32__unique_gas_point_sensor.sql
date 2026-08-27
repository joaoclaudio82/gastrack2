-- Enforce single sensor per gas point at DB level
-- First clean up any duplicates (keep lowest ID)
DELETE FROM equipment e1
  USING equipment e2
  WHERE e1.gas_point_id = e2.gas_point_id
    AND e1.gas_point_id IS NOT NULL
    AND e1.id > e2.id;

ALTER TABLE equipment ADD CONSTRAINT uq_equipment_gas_point_id UNIQUE (gas_point_id);
