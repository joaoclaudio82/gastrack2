package com.gastrack.service.impl;

import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.security.TenantContext;
import com.gastrack.service.TenantSecurityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Implementation of TenantSecurityService.
 * Provides centralized multi-tenant security validation.
 */
@Slf4j
@Service
public class TenantSecurityServiceImpl implements TenantSecurityService {

    @Override
    public void validateCompanyAccess(Long companyId) {
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID cannot be null");
        }

        if (TenantContext.isSuperAdmin()) {
            log.debug("SUPER_ADMIN access granted to company: {}", companyId);
            return;
        }

        Long currentCompanyId = TenantContext.getCurrentCompanyId();
        if (currentCompanyId == null) {
            log.warn("Access denied: No company associated with current user");
            throw new AccessDeniedException("No company associated with current user");
        }

        if (!currentCompanyId.equals(companyId)) {
            log.warn("Access denied: User from company {} attempted to access company {}",
                currentCompanyId, companyId);
            throw new AccessDeniedException("Access denied to this company's resources");
        }

        log.debug("Access granted to company: {}", companyId);
    }

    @Override
    public void requireSuperAdmin() {
        if (!TenantContext.isSuperAdmin()) {
            log.warn("Access denied: SUPER_ADMIN role required");
            throw new AccessDeniedException("Super admin access required");
        }
    }

    @Override
    public Long requireCompanyContext() {
        if (TenantContext.isSuperAdmin()) {
            throw new BusinessException("Super admin must specify company explicitly");
        }

        Long companyId = TenantContext.getCurrentCompanyId();
        if (companyId == null) {
            throw new AccessDeniedException("No company associated with current user");
        }

        return companyId;
    }

    @Override
    public Long getCurrentCompanyIdOrNull() {
        if (TenantContext.isSuperAdmin()) {
            return null;
        }
        return TenantContext.getCurrentCompanyId();
    }

    @Override
    public boolean isSuperAdmin() {
        return TenantContext.isSuperAdmin();
    }
}
