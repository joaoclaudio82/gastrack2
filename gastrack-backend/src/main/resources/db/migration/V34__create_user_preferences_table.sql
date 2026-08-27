-- V34: create user_preferences table for per-user analytics settings
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    analytics_refresh_interval_seconds INT NOT NULL DEFAULT 5
        CHECK (analytics_refresh_interval_seconds BETWEEN 1 AND 30),
    analytics_streaming_paused BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'Per-user application preferences (1:1 with users)';
COMMENT ON COLUMN user_preferences.analytics_refresh_interval_seconds IS 'Interval in seconds (1-30) for realtime analytics chart refresh';
COMMENT ON COLUMN user_preferences.analytics_streaming_paused IS 'When true, the analytics streaming chart is paused';
