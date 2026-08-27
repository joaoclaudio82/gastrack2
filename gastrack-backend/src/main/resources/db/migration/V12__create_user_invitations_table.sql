-- V12: Create user_invitations table for the invitation system
-- This table tracks invitations sent by admins to new users

CREATE SEQUENCE IF NOT EXISTS user_invitation_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS user_invitations (
    id BIGINT NOT NULL DEFAULT nextval('user_invitation_id_seq'),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    company_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    cognito_username VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_invitations_token UNIQUE (token),
    CONSTRAINT chk_invitation_role CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_invitation_status CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT fk_user_invitations_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_user_invitations_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Indexes for common queries
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);
CREATE INDEX idx_user_invitations_company_id ON user_invitations(company_id);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX idx_user_invitations_created_by ON user_invitations(created_by_user_id);

-- Partial unique index: only one pending invitation per email
CREATE UNIQUE INDEX uk_user_invitations_email_pending
    ON user_invitations(email)
    WHERE status = 'PENDING';

-- Comments for documentation
COMMENT ON TABLE user_invitations IS 'Stores user invitations sent by admins. Linked to Cognito AdminCreateUser.';
COMMENT ON COLUMN user_invitations.token IS 'Unique token for the invitation, used for tracking';
COMMENT ON COLUMN user_invitations.cognito_username IS 'Username in Cognito, set after successful user creation';
COMMENT ON COLUMN user_invitations.expires_at IS 'Invitation expiration date (7 days from creation by default)';
