package com.gastrack.service;

import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.model.UserRole;
import com.gastrack.security.TenantContext;
import com.gastrack.service.impl.TenantSecurityServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("TenantSecurityService Tests")
class TenantSecurityServiceImplTest {

    private TenantSecurityService tenantSecurityService;

    @BeforeEach
    void setUp() {
        tenantSecurityService = new TenantSecurityServiceImpl();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Nested
    @DisplayName("validateCompanyAccess")
    class ValidateCompanyAccess {

        @Test
        void should_AllowAccess_When_UserBelongsToSameCompany() {
            TenantContext.setCurrentCompanyId(1L);
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            tenantSecurityService.validateCompanyAccess(1L);
            // No exception thrown
        }

        @Test
        void should_AllowAccess_When_UserIsSuperAdmin() {
            TenantContext.setCurrentUserRole(UserRole.SUPER_ADMIN);

            tenantSecurityService.validateCompanyAccess(1L);
            tenantSecurityService.validateCompanyAccess(2L);
            tenantSecurityService.validateCompanyAccess(999L);
            // No exception thrown for any company
        }

        @Test
        void should_DenyAccess_When_UserBelongsToDifferentCompany() {
            TenantContext.setCurrentCompanyId(1L);
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            assertThatThrownBy(() -> tenantSecurityService.validateCompanyAccess(2L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Access denied to this company's resources");
        }

        @Test
        void should_DenyAccess_When_NoCompanyContext() {
            TenantContext.setCurrentUserRole(UserRole.ADMIN);
            // No company ID set

            assertThatThrownBy(() -> tenantSecurityService.validateCompanyAccess(1L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("No company associated with current user");
        }

        @Test
        void should_ThrowException_When_CompanyIdIsNull() {
            TenantContext.setCurrentCompanyId(1L);
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            assertThatThrownBy(() -> tenantSecurityService.validateCompanyAccess(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Company ID cannot be null");
        }
    }

    @Nested
    @DisplayName("requireSuperAdmin")
    class RequireSuperAdmin {

        @Test
        void should_Pass_When_UserIsSuperAdmin() {
            TenantContext.setCurrentUserRole(UserRole.SUPER_ADMIN);

            tenantSecurityService.requireSuperAdmin();
            // No exception thrown
        }

        @Test
        void should_ThrowException_When_UserIsAdmin() {
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            assertThatThrownBy(() -> tenantSecurityService.requireSuperAdmin())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Super admin access required");
        }

        @Test
        void should_ThrowException_When_UserIsRegularUser() {
            TenantContext.setCurrentUserRole(UserRole.USER);

            assertThatThrownBy(() -> tenantSecurityService.requireSuperAdmin())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Super admin access required");
        }
    }

    @Nested
    @DisplayName("requireCompanyContext")
    class RequireCompanyContext {

        @Test
        void should_ReturnCompanyId_When_UserHasCompanyContext() {
            TenantContext.setCurrentCompanyId(42L);
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            Long result = tenantSecurityService.requireCompanyContext();

            assertThat(result).isEqualTo(42L);
        }

        @Test
        void should_ThrowException_When_UserIsSuperAdmin() {
            TenantContext.setCurrentUserRole(UserRole.SUPER_ADMIN);

            assertThatThrownBy(() -> tenantSecurityService.requireCompanyContext())
                .isInstanceOf(BusinessException.class)
                .hasMessage("Super admin must specify company explicitly");
        }

        @Test
        void should_ThrowException_When_NoCompanyContext() {
            TenantContext.setCurrentUserRole(UserRole.ADMIN);
            // No company ID set

            assertThatThrownBy(() -> tenantSecurityService.requireCompanyContext())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("No company associated with current user");
        }
    }

    @Nested
    @DisplayName("getCurrentCompanyIdOrNull")
    class GetCurrentCompanyIdOrNull {

        @Test
        void should_ReturnCompanyId_When_UserHasCompanyContext() {
            TenantContext.setCurrentCompanyId(42L);
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            Long result = tenantSecurityService.getCurrentCompanyIdOrNull();

            assertThat(result).isEqualTo(42L);
        }

        @Test
        void should_ReturnNull_When_UserIsSuperAdmin() {
            TenantContext.setCurrentUserRole(UserRole.SUPER_ADMIN);

            Long result = tenantSecurityService.getCurrentCompanyIdOrNull();

            assertThat(result).isNull();
        }

        @Test
        void should_ReturnNull_When_NoCompanyContext() {
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            Long result = tenantSecurityService.getCurrentCompanyIdOrNull();

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("isSuperAdmin")
    class IsSuperAdmin {

        @Test
        void should_ReturnTrue_When_UserIsSuperAdmin() {
            TenantContext.setCurrentUserRole(UserRole.SUPER_ADMIN);

            assertThat(tenantSecurityService.isSuperAdmin()).isTrue();
        }

        @Test
        void should_ReturnFalse_When_UserIsAdmin() {
            TenantContext.setCurrentUserRole(UserRole.ADMIN);

            assertThat(tenantSecurityService.isSuperAdmin()).isFalse();
        }

        @Test
        void should_ReturnFalse_When_UserIsRegularUser() {
            TenantContext.setCurrentUserRole(UserRole.USER);

            assertThat(tenantSecurityService.isSuperAdmin()).isFalse();
        }

        @Test
        void should_ReturnFalse_When_NoRoleSet() {
            assertThat(tenantSecurityService.isSuperAdmin()).isFalse();
        }
    }
}
