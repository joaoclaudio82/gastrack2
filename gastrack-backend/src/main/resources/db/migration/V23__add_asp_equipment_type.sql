-- Add ASP (Air Supply Pump) equipment type required for IoT auto-provisioning
INSERT INTO equipment_types (id, name, description, active, created_at, updated_at)
VALUES (nextval('equipment_type_id_seq'), 'ASP', 'Air Supply Pump - Módulo principal do kit IoT para comunicação MQTT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
