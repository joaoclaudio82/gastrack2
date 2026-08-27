-- Per-company override for the "sem sinal" (stale reading) limit, in minutes.
-- NULL falls back to the global default (60 min) applied in the service layer.
ALTER TABLE companies ADD COLUMN stale_reading_threshold_minutes INTEGER;
