package com.gastrack.security;

import com.gastrack.model.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void should_StoreAndRetrieve_CompanyId() {
        TenantContext.setCurrentCompanyId(1L);

        assertThat(TenantContext.getCurrentCompanyId()).isEqualTo(1L);
    }

    @Test
    void should_StoreAndRetrieve_UserSub() {
        TenantContext.setCurrentUserSub("test-sub-123");

        assertThat(TenantContext.getCurrentUserSub()).isEqualTo("test-sub-123");
    }

    @Test
    void should_StoreAndRetrieve_UserRole() {
        TenantContext.setCurrentUserRole(UserRole.ADMIN);

        assertThat(TenantContext.getCurrentUserRole()).isEqualTo(UserRole.ADMIN);
    }

    @Test
    void should_ReturnTrue_When_UserIsSuperAdmin() {
        TenantContext.setCurrentUserRole(UserRole.SUPER_ADMIN);

        assertThat(TenantContext.isSuperAdmin()).isTrue();
    }

    @Test
    void should_ReturnFalse_When_UserIsNotSuperAdmin() {
        TenantContext.setCurrentUserRole(UserRole.ADMIN);

        assertThat(TenantContext.isSuperAdmin()).isFalse();
    }

    @Test
    void should_ReturnFalse_When_RoleIsNull() {
        assertThat(TenantContext.isSuperAdmin()).isFalse();
    }

    @Test
    void should_ClearAllContext_When_ClearCalled() {
        TenantContext.setCurrentCompanyId(1L);
        TenantContext.setCurrentUserSub("test-sub");
        TenantContext.setCurrentUserRole(UserRole.ADMIN);

        TenantContext.clear();

        assertThat(TenantContext.getCurrentCompanyId()).isNull();
        assertThat(TenantContext.getCurrentUserSub()).isNull();
        assertThat(TenantContext.getCurrentUserRole()).isNull();
    }

    @Test
    void should_ReturnNull_When_NoValueSet() {
        assertThat(TenantContext.getCurrentCompanyId()).isNull();
        assertThat(TenantContext.getCurrentUserSub()).isNull();
        assertThat(TenantContext.getCurrentUserRole()).isNull();
    }

    @Test
    void should_HandleMultipleThreads_Independently() throws InterruptedException {
        TenantContext.setCurrentCompanyId(1L);
        TenantContext.setCurrentUserRole(UserRole.ADMIN);

        Thread otherThread = new Thread(() -> {
            TenantContext.setCurrentCompanyId(2L);
            TenantContext.setCurrentUserRole(UserRole.USER);

            assertThat(TenantContext.getCurrentCompanyId()).isEqualTo(2L);
            assertThat(TenantContext.getCurrentUserRole()).isEqualTo(UserRole.USER);
        });

        otherThread.start();
        otherThread.join();

        // Main thread should still have original values
        assertThat(TenantContext.getCurrentCompanyId()).isEqualTo(1L);
        assertThat(TenantContext.getCurrentUserRole()).isEqualTo(UserRole.ADMIN);
    }
}
