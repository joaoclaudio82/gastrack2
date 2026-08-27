-- V10: Add constraint to ensure non-SUPER_ADMIN users must have a company
-- SUPER_ADMIN users can have NULL company_id, but USER and ADMIN must have a company

-- Add CHECK constraint at database level
ALTER TABLE users
ADD CONSTRAINT chk_users_company_required_for_non_superadmin
CHECK (
    role = 'SUPER_ADMIN' OR company_id IS NOT NULL
);

-- Add comment for documentation
COMMENT ON CONSTRAINT chk_users_company_required_for_non_superadmin ON users IS
'Ensures that USER and ADMIN roles must have a company_id. Only SUPER_ADMIN can have NULL company_id.';
