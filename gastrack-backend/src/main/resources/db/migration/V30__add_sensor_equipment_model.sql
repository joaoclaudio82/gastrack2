-- Add Sensor equipment type: logical sensor = one port (1-8) of an ESP32
INSERT INTO equipment_types (name, description, active, created_at, updated_at)
VALUES (
    'Sensor',
    'Sensor lógico - representa uma porta (1-8) de um ESP32 para filtro de leituras no DynamoDB',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add columns to equipment for sensor subtype
ALTER TABLE equipment
    ADD COLUMN parent_equipment_id BIGINT,
    ADD COLUMN sensor_port INTEGER,
    ADD COLUMN codigo_sensor VARCHAR(100);

ALTER TABLE equipment
    ADD CONSTRAINT fk_equipment_parent
        FOREIGN KEY (parent_equipment_id) REFERENCES equipment(id);

CREATE INDEX idx_equipment_parent_id ON equipment(parent_equipment_id);
CREATE UNIQUE INDEX idx_equipment_codigo_sensor ON equipment(codigo_sensor) WHERE codigo_sensor IS NOT NULL;

-- Migrate: for each ESP32 linked to a gas point, create a Sensor equipment (port 1) and reassign
DO $$
DECLARE
    v_esp32 RECORD;
    v_sensor_type_id BIGINT;
    v_esp32_type_id BIGINT;
    v_new_asset_tag VARCHAR(50);
    v_counter INT := 0;
BEGIN
    SELECT id INTO v_sensor_type_id FROM equipment_types WHERE name = 'Sensor' LIMIT 1;
    SELECT id INTO v_esp32_type_id FROM equipment_types WHERE name = 'ESP32' LIMIT 1;

    IF v_sensor_type_id IS NULL OR v_esp32_type_id IS NULL THEN
        RAISE EXCEPTION 'Equipment types Sensor or ESP32 not found';
    END IF;

    FOR v_esp32 IN
        SELECT e.id, e.gas_point_id, e.asset_tag, e.serial_number, e.equipment_kit_id, e.created_by
        FROM equipment e
        WHERE e.gas_point_id IS NOT NULL
          AND e.equipment_type_id = v_esp32_type_id
          AND e.active = true
    LOOP
        v_new_asset_tag := v_esp32.asset_tag || '-P1';
        -- Ensure unique asset_tag (append counter if collision)
        WHILE EXISTS (SELECT 1 FROM equipment WHERE asset_tag = v_new_asset_tag) LOOP
            v_counter := v_counter + 1;
            v_new_asset_tag := v_esp32.asset_tag || '-P1-' || v_counter;
        END LOOP;

        INSERT INTO equipment (
            equipment_kit_id,
            equipment_type_id,
            asset_tag,
            parent_equipment_id,
            sensor_port,
            codigo_sensor,
            gas_point_id,
            condition,
            active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            v_esp32.equipment_kit_id,
            v_sensor_type_id,
            v_new_asset_tag,
            v_esp32.id,
            1,
            COALESCE(v_esp32.serial_number, 'MIG-' || v_esp32.id) || '|1',
            v_esp32.gas_point_id,
            'NEW',
            true,
            v_esp32.created_by,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        UPDATE equipment SET gas_point_id = NULL WHERE id = v_esp32.id;
    END LOOP;
END $$;
