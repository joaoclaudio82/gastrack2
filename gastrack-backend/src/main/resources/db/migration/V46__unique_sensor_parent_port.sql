-- Auditoria #7: só existia UNIQUE(codigo_sensor) parcial (V30). Nada impedia dois
-- Equipment do tipo Sensor apontando para o mesmo (ESP32, porta) — por isso
-- findOrCreateSensorEquipment precisava de um fallback "conserta pai corrompido".

-- Falha alto se houver duplicata: escolher qual sensor sobrevive (e para onde vão os
-- pontos de gás vinculados) é decisão de negócio, não de migration.
DO $$
DECLARE dups BIGINT;
BEGIN
    SELECT COUNT(*) INTO dups FROM (
        SELECT parent_equipment_id, sensor_port
        FROM equipment
        WHERE parent_equipment_id IS NOT NULL AND sensor_port IS NOT NULL
        GROUP BY parent_equipment_id, sensor_port
        HAVING COUNT(*) > 1
    ) d;
    IF dups > 0 THEN
        RAISE EXCEPTION
            'V46 abortada: % par(es) (parent_equipment_id, sensor_port) duplicado(s). Resolva antes: SELECT parent_equipment_id, sensor_port, array_agg(id) FROM equipment WHERE parent_equipment_id IS NOT NULL AND sensor_port IS NOT NULL GROUP BY 1,2 HAVING COUNT(*) > 1;',
            dups;
    END IF;
END $$;

CREATE UNIQUE INDEX uq_equipment_parent_port
    ON equipment (parent_equipment_id, sensor_port)
    WHERE parent_equipment_id IS NOT NULL AND sensor_port IS NOT NULL;
