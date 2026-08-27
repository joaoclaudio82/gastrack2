-- Create sequences for location tables
CREATE SEQUENCE IF NOT EXISTS country_id_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS state_id_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS city_id_seq START WITH 1 INCREMENT BY 50;

-- Create countries table (global, not multi-tenant)
CREATE TABLE countries (
    id BIGINT NOT NULL DEFAULT nextval('country_id_seq'),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_countries_code UNIQUE (code)
);

CREATE INDEX idx_countries_active ON countries(active);
CREATE INDEX idx_countries_code ON countries(code);

-- Create states table (global, not multi-tenant)
CREATE TABLE states (
    id BIGINT NOT NULL DEFAULT nextval('state_id_seq'),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(2) NOT NULL,
    abbreviation VARCHAR(2) NOT NULL,
    country_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_states_code UNIQUE (code),
    CONSTRAINT uk_states_abbreviation_country UNIQUE (abbreviation, country_id),
    CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE INDEX idx_states_country_id ON states(country_id);
CREATE INDEX idx_states_active ON states(active);
CREATE INDEX idx_states_abbreviation ON states(abbreviation);

-- Create cities table (global, not multi-tenant)
CREATE TABLE cities (
    id BIGINT NOT NULL DEFAULT nextval('city_id_seq'),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(7) NOT NULL,
    state_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_cities_code UNIQUE (code),
    CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id)
);

CREATE INDEX idx_cities_state_id ON cities(state_id);
CREATE INDEX idx_cities_active ON cities(active);
CREATE INDEX idx_cities_name ON cities(name);
