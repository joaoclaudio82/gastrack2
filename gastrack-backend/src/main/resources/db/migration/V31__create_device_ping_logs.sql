CREATE SEQUENCE IF NOT EXISTS device_ping_log_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE device_ping_logs (
    id BIGINT PRIMARY KEY DEFAULT nextval('device_ping_log_id_seq'),
    serial_number VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    equipment_id BIGINT,
    pinged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_ping_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE INDEX idx_device_ping_serial ON device_ping_logs(serial_number);
CREATE INDEX idx_device_ping_pinged_at ON device_ping_logs(pinged_at DESC);
