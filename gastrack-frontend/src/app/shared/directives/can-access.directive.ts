import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { PermissionService } from '@core/auth/services/permission.service';
import { Permission, UserRole } from '@models/role.model';

/**
 * Structural directive that conditionally renders content based on user permissions or roles.
 *
 * This is more flexible than hasRole directive as it supports:
 * - Permission-based access (via Permission enum)
 * - Role-based access (via UserRole enum)
 * - Minimum role level checks
 *
 * @example
 * ```html
 * <!-- Show only if user has MANAGE_CUSTOMERS permission -->
 * <button *appCanAccess="'manage:customers'">Edit Customer</button>
 *
 * <!-- Show only if user has any of these permissions -->
 * <div *appCanAccess="['view:reports', 'export:reports']">
 *   Reports Section
 * </div>
 *
 * <!-- Show only if user is at least ADMIN -->
 * <div *appCanAccess="'ADMIN'; mode: 'role'">
 *   Admin Panel
 * </div>
 *
 * <!-- Show only if user has at least ADMIN role level -->
 * <div *appCanAccess="'ADMIN'; mode: 'atLeast'">
 *   Admin or higher
 * </div>
 * ```
 */
@Directive({
  selector: '[appCanAccess]',
  standalone: true,
})
export class CanAccessDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  /**
   * Permission(s) or role(s) to check
   * Can be a single value or array
   */
  readonly appCanAccess = input.required<
    Permission | Permission[] | UserRole | UserRole[] | string | string[]
  >();

  /**
   * Access check mode:
   * - 'permission' (default): Check if user has permission(s)
   * - 'role': Check if user has exact role(s)
   * - 'atLeast': Check if user's role is >= specified role
   */
  readonly appCanAccessMode = input<'permission' | 'role' | 'atLeast'>('permission');

  /**
   * When multiple values provided:
   * - 'any' (default): User must have at least one
   * - 'all': User must have all
   */
  readonly appCanAccessMatch = input<'any' | 'all'>('any');

  private hasView = false;

  constructor() {
    effect(() => {
      const value = this.appCanAccess();
      const mode = this.appCanAccessMode();
      const match = this.appCanAccessMatch();

      const hasAccess = this.checkAccess(value, mode, match);

      if (hasAccess && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasAccess && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  private checkAccess(
    value: Permission | Permission[] | UserRole | UserRole[] | string | string[],
    mode: 'permission' | 'role' | 'atLeast',
    match: 'any' | 'all',
  ): boolean {
    const values = Array.isArray(value) ? value : [value];

    switch (mode) {
      case 'permission': {
        const permissions = values as Permission[];
        return match === 'any'
          ? this.permissionService.canAny(permissions)
          : this.permissionService.canAll(permissions);
      }

      case 'role': {
        const roles = values as UserRole[];
        return match === 'any'
          ? this.permissionService.hasAnyRole(roles)
          : roles.every((r) => this.permissionService.hasRole(r));
      }

      case 'atLeast': {
        // For atLeast mode, only first value is used
        const role = values[0] as UserRole;
        return this.permissionService.isAtLeast(role);
      }

      default:
        return false;
    }
  }
}
