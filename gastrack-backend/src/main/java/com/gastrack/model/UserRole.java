package com.gastrack.model;

/**
 * User roles for authorization.
 * These roles are used locally and can be synced with Cognito groups.
 */
public enum UserRole {

    /**
     * Standard user with basic access to own company data.
     */
    USER,

    /**
     * Administrator with full access within their company.
     * Can invite new users (USER or ADMIN) to their company.
     */
    ADMIN,

    /**
     * Super administrator with full access to all companies.
     * Can invite any role to any company.
     */
    SUPER_ADMIN
}
