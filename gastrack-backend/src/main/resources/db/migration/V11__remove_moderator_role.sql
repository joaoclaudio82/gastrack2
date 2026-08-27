-- V11: Remove MODERATOR role from the system
-- MODERATOR users are converted to USER, and the role constraint is updated

-- Update any existing MODERATOR users to USER
UPDATE users SET role = 'USER' WHERE role = 'MODERATOR';

-- Update role constraint to exclude MODERATOR
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_role_values;
ALTER TABLE users ADD CONSTRAINT chk_role_values
    CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: USER, ADMIN, or SUPER_ADMIN (MODERATOR removed in V11)';
