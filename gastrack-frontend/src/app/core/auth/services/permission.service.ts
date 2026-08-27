import { Injectable, computed, inject } from '@angular/core';
import {
  Permission,
  ROLE_PERMISSIONS,
  UserRole,
  isRoleAtLeast,
  roleHasPermission,
} from '@models/role.model';
import { AuthService } from './auth.service';

/**
 * Service for checking user permissions and roles
 *
 * Uses the AuthService to get current user roles and provides
 * methods to check permissions against the defined role hierarchy.
 *
 * @example
 * ```typescript
 * // In a component
 * private readonly permissions = inject(PermissionService);
 *
 * // Check if user can manage customers
 * if (this.permissions.can(Permission.MANAGE_CUSTOMERS)) {
 *   // Show edit button
 * }
 *
 * // Check if user has admin role or higher
 * if (this.permissions.isAtLeast(UserRole.ADMIN)) {
 *   // Show admin menu
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly authService = inject(AuthService);

  /**
   * Current user's highest role
   */
  readonly currentRole = computed<UserRole | null>(() => {
    const roles = this.authService.userRoles();
    if (roles.length === 0) return null;

    // Find highest role based on hierarchy
    let highestRole: UserRole | null = null;
    let highestLevel = 0;

    for (const roleStr of roles) {
      const role = roleStr as UserRole;
      if (Object.values(UserRole).includes(role)) {
        const level = this.getRoleLevel(role);
        if (level > highestLevel) {
          highestLevel = level;
          highestRole = role;
        }
      }
    }

    return highestRole;
  });

  /**
   * All permissions the current user has
   */
  readonly permissions = computed<Permission[]>(() => {
    const role = this.currentRole();
    if (!role) return [];
    return ROLE_PERMISSIONS[role];
  });

  /**
   * Whether the user is authenticated
   */
  readonly isAuthenticated = this.authService.isAuthenticated;

  /**
   * Whether the user is an admin or higher
   */
  readonly isAdmin = computed(() => this.isAtLeast(UserRole.ADMIN));

  /**
   * Whether the user is a super admin
   */
  readonly isSuperAdmin = computed(() => this.isAtLeast(UserRole.SUPER_ADMIN));

  /**
   * Check if user has a specific permission
   *
   * @param permission - Permission to check
   * @returns true if user has the permission
   */
  can(permission: Permission): boolean {
    const role = this.currentRole();
    if (!role) return false;
    return roleHasPermission(role, permission);
  }

  /**
   * Check if user has any of the specified permissions
   *
   * @param permissions - Permissions to check
   * @returns true if user has at least one permission
   */
  canAny(permissions: Permission[]): boolean {
    return permissions.some((p) => this.can(p));
  }

  /**
   * Check if user has all of the specified permissions
   *
   * @param permissions - Permissions to check
   * @returns true if user has all permissions
   */
  canAll(permissions: Permission[]): boolean {
    return permissions.every((p) => this.can(p));
  }

  /**
   * Check if user's role is at least the specified role
   *
   * @param requiredRole - Minimum role required
   * @returns true if user's role is >= required role
   */
  isAtLeast(requiredRole: UserRole): boolean {
    const role = this.currentRole();
    if (!role) return false;
    return isRoleAtLeast(role, requiredRole);
  }

  /**
   * Check if user has a specific role (exact match)
   *
   * @param role - Role to check
   * @returns true if user has the exact role
   */
  hasRole(role: UserRole): boolean {
    return this.authService.hasRole(role);
  }

  /**
   * Check if user has any of the specified roles
   *
   * @param roles - Roles to check
   * @returns true if user has at least one role
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  /**
   * Get numeric level for a role (used for hierarchy comparison)
   */
  private getRoleLevel(role: UserRole): number {
    const levels: Record<UserRole, number> = {
      [UserRole.USER]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3,
    };
    return levels[role] ?? 0;
  }
}
