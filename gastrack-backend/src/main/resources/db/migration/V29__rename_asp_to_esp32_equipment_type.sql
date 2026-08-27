-- Rename ASP equipment type to ESP32 (nomenclature correction)
UPDATE equipment_types
SET name = 'ESP32', description = 'ESP32 - Módulo principal do kit IoT para comunicação MQTT e monitoramento de pressão'
WHERE name = 'ASP';
