-- Movement History table (audit trail)
-- Immutable records - no updates allowed
-- Links to equipment and/or equipment_kit

CREATE SEQUENCE IF NOT EXISTS movement_history_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE movement_history (
    id BIGINT NOT NULL DEFAULT nextval('movement_history_id_seq'),
    equipment_id BIGINT,
    equipment_kit_id BIGINT,
    user_id BIGINT,
    operation VARCHAR(30) NOT NULL,
    operation_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    from_kit_id BIGINT,
    to_kit_id BIGINT,
    notes TEXT,
    PRIMARY KEY (id),
    CONSTRAINT fk_movement_history_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    CONSTRAINT fk_movement_history_kit FOREIGN KEY (equipment_kit_id) REFERENCES equipment_kits(id),
    CONSTRAINT fk_movement_history_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_movement_history_from_kit FOREIGN KEY (from_kit_id) REFERENCES equipment_kits(id),
    CONSTRAINT fk_movement_history_to_kit FOREIGN KEY (to_kit_id) REFERENCES equipment_kits(id),
    CONSTRAINT chk_movement_history_operation CHECK (operation IN (
        'CREATED', 'ASSIGNED_TO_KIT', 'REMOVED_FROM_KIT', 'TRANSFERRED',
        'CONDITION_CHANGED', 'DEACTIVATED', 'REACTIVATED',
        'KIT_CREATED', 'KIT_INSTALLED', 'KIT_MAINTENANCE_START',
        'KIT_MAINTENANCE_END', 'KIT_REMOVED', 'KIT_DECOMMISSIONED'
    )),
    CONSTRAINT chk_movement_history_target CHECK (equipment_id IS NOT NULL OR equipment_kit_id IS NOT NULL)
);

CREATE INDEX idx_movement_history_equipment_id ON movement_history(equipment_id);
CREATE INDEX idx_movement_history_kit_id ON movement_history(equipment_kit_id);
CREATE INDEX idx_movement_history_operation_at ON movement_history(operation_at);
CREATE INDEX idx_movement_history_operation ON movement_history(operation);
