CREATE SEQUENCE IF NOT EXISTS user_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL DEFAULT nextval('user_id_seq'),
    cognito_sub VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_picture_url VARCHAR(500),
    birth_date DATE,
    locale VARCHAR(10),
    timezone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_cognito_sub UNIQUE (cognito_sub),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_role_values CHECK (role IN ('USER', 'ADMIN', 'MODERATOR'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(active, role);
