package com.gastrack.security;

import com.gastrack.model.UserRole;

/**
 * Thread-local context for multi-tenant security.
 * Stores the current company, user, and role for the request.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> currentCompanyId = new ThreadLocal<>();
    private static final ThreadLocal<Long> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentUserSub = new ThreadLocal<>();
    private static final ThreadLocal<UserRole> currentUserRole = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    public static Long getCurrentCompanyId() {
        return currentCompanyId.get();
    }

    public static void setCurrentCompanyId(Long companyId) {
        currentCompanyId.set(companyId);
    }

    public static Long getCurrentUserId() {
        return currentUserId.get();
    }

    public static void setCurrentUserId(Long userId) {
        currentUserId.set(userId);
    }

    public static String getCurrentUserSub() {
        return currentUserSub.get();
    }

    public static void setCurrentUserSub(String userSub) {
        currentUserSub.set(userSub);
    }

    public static UserRole getCurrentUserRole() {
        return currentUserRole.get();
    }

    public static void setCurrentUserRole(UserRole role) {
        currentUserRole.set(role);
    }

    public static boolean isSuperAdmin() {
        return UserRole.SUPER_ADMIN.equals(currentUserRole.get());
    }

    /**
     * Clear all thread-local values.
     * Should be called at the end of each request.
     */
    public static void clear() {
        currentCompanyId.remove();
        currentUserId.remove();
        currentUserSub.remove();
        currentUserRole.remove();
    }
}
