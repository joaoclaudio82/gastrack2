-- Fatia 2e: persist gas point refills. AUTO from a sensor pressure jump; MANUAL when the
-- client registers a new bottle serial. Additive, no backfill.
CREATE SEQUENCE IF NOT EXISTS refill_event_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE refill_events (
    id BIGINT PRIMARY KEY DEFAULT nextval('refill_event_id_seq'),
    gas_point_id BIGINT NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    from_fill DECIMAL(6, 2),
    to_fill DECIMAL(6, 2),
    source VARCHAR(10) NOT NULL,
    cylinder_id BIGINT,
    CONSTRAINT fk_refill_events_gas_point FOREIGN KEY (gas_point_id) REFERENCES gas_points(id),
    CONSTRAINT fk_refill_events_cylinder FOREIGN KEY (cylinder_id) REFERENCES cylinders(id),
    CONSTRAINT chk_refill_events_source CHECK (source IN ('AUTO', 'MANUAL'))
);

CREATE INDEX idx_refill_events_gas_point ON refill_events(gas_point_id, detected_at DESC);
