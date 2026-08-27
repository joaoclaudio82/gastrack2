CREATE SEQUENCE IF NOT EXISTS company_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE companies (
    id BIGINT NOT NULL DEFAULT nextval('company_id_seq'),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    phone VARCHAR(20),
    email VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_companies_slug UNIQUE (slug),
    CONSTRAINT uk_companies_cnpj UNIQUE (cnpj)
);

CREATE INDEX idx_companies_active ON companies(active);
