CREATE SEQUENCE IF NOT EXISTS sensor_cylinder_mapping_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE sensor_cylinder_mappings (
    id              BIGINT    NOT NULL DEFAULT nextval('sensor_cylinder_mapping_id_seq'),
    equipment_id    BIGINT    NOT NULL,
    cylinder_id     BIGINT    NOT NULL,
    sensor_port     INTEGER,
    active          BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_scm_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    CONSTRAINT fk_scm_cylinder  FOREIGN KEY (cylinder_id) REFERENCES cylinders(id),
    CONSTRAINT uk_scm_equipment_cylinder UNIQUE (equipment_id, cylinder_id),
    CONSTRAINT uk_scm_equipment_port UNIQUE (equipment_id, sensor_port)
);

CREATE INDEX idx_scm_equipment_id ON sensor_cylinder_mappings(equipment_id);
CREATE INDEX idx_scm_cylinder_id ON sensor_cylinder_mappings(cylinder_id);
