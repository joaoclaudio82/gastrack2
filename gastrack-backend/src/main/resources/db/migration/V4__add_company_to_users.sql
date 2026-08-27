ALTER TABLE users ADD COLUMN company_id BIGINT;

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_role_values;
ALTER TABLE users ADD CONSTRAINT chk_role_values
    CHECK (role IN ('USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN'));

ALTER TABLE users ADD CONSTRAINT fk_users_company
    FOREIGN KEY (company_id) REFERENCES companies(id);

CREATE INDEX idx_users_company_id ON users(company_id);
