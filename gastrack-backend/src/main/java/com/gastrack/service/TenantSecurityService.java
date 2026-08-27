package com.gastrack.service;

/**
 * Service for multi-tenant security validation.
 * Centralizes all tenant access control logic.
 */
public interface TenantSecurityService {

    /**
     * Validates that the current user has access to the specified company's resources.
     * SUPER_ADMIN users have access to all companies.
     *
     * @param companyId the company ID to validate access for
     * @throws com.gastrack.exceptions.AccessDeniedException if access is denied
     */
    void validateCompanyAccess(Long companyId);

    /**
     * Requires the current user to be a SUPER_ADMIN.
     *
     * @throws com.gastrack.exceptions.AccessDeniedException if not SUPER_ADMIN
     */
    void requireSuperAdmin();

    /**
     * Gets the current company ID from tenant context.
     * Throws exception if user is SUPER_ADMIN (must specify company explicitly).
     *
     * @return the current company ID
     * @throws com.gastrack.exceptions.BusinessException if SUPER_ADMIN
     * @throws com.gastrack.exceptions.AccessDeniedException if no company context
     */
    Long requireCompanyContext();

    /**
     * Gets the current company ID, or null for SUPER_ADMIN.
     *
     * @return the current company ID or null if SUPER_ADMIN
     */
    Long getCurrentCompanyIdOrNull();

    /**
     * Checks if the current user is a SUPER_ADMIN.
     *
     * @return true if SUPER_ADMIN
     */
    boolean isSuperAdmin();
}
