/**
 * User roles in the GasTrack system
 *
 * Roles follow a hierarchy where higher roles inherit all permissions
 * from lower roles (SUPER_ADMIN > ADMIN > USER)
 */
export enum UserRole {
  /** Basic user - can view cylinders and basic dashboard */
  USER = 'USER',

  /** Admin user - can manage customers, orders, and view reports */
  ADMIN = 'ADMIN',

  /** Super admin - full system access including user management */
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Permission types available in the system
 */
export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'view:dashboard',

  // Cylinders
  VIEW_CYLINDERS = 'view:cylinders',
  MANAGE_CYLINDERS = 'manage:cylinders',

  // Customers
  VIEW_CUSTOMERS = 'view:customers',
  MANAGE_CUSTOMERS = 'manage:customers',

  // Orders
  VIEW_ORDERS = 'view:orders',
  MANAGE_ORDERS = 'manage:orders',
  CREATE_ORDERS = 'create:orders',

  // Inventory
  VIEW_INVENTORY = 'view:inventory',
  MANAGE_INVENTORY = 'manage:inventory',

  // Reports
  VIEW_REPORTS = 'view:reports',
  EXPORT_REPORTS = 'export:reports',

  // Settings
  VIEW_SETTINGS = 'view:settings',
  MANAGE_SETTINGS = 'manage:settings',

  // Users (admin only)
  VIEW_USERS = 'view:users',
  MANAGE_USERS = 'manage:users',

  // Addresses (admin only)
  VIEW_ADDRESSES = 'view:addresses',
  MANAGE_ADDRESSES = 'manage:addresses',

  // Invitations (admin only)
  VIEW_INVITATIONS = 'view:invitations',
  MANAGE_INVITATIONS = 'manage:invitations',

  // Companies (super admin only)
  VIEW_COMPANIES = 'view:companies',
  MANAGE_COMPANIES = 'manage:companies',

  // System (super admin only)
  SYSTEM_CONFIG = 'system:config',
}

/**
 * Role hierarchy - higher index means higher privileges
 * Used to determine if a user's role is >= required role
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

/**
 * Permissions granted to each role
 * Higher roles inherit all permissions from lower roles
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CYLINDERS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
  ],
  [UserRole.ADMIN]: [
    // Inherits USER permissions
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CYLINDERS,
    Permission.MANAGE_CYLINDERS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.MANAGE_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_USERS,
    // Multi-tenant permissions
    Permission.VIEW_ADDRESSES,
    Permission.MANAGE_ADDRESSES,
    Permission.VIEW_INVITATIONS,
    Permission.MANAGE_INVITATIONS,
  ],
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CYLINDERS,
    Permission.MANAGE_CYLINDERS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.MANAGE_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    // Multi-tenant permissions
    Permission.VIEW_ADDRESSES,
    Permission.MANAGE_ADDRESSES,
    Permission.VIEW_INVITATIONS,
    Permission.MANAGE_INVITATIONS,
    Permission.VIEW_COMPANIES,
    Permission.MANAGE_COMPANIES,
    Permission.SYSTEM_CONFIG,
  ],
};

/**
 * Role display labels for UI
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.USER]: 'Usuário',
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};

/**
 * Role badge colors for UI (using design system variables)
 */
export const ROLE_BADGE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  [UserRole.USER]: { bg: 'bg-secondary', text: 'text-secondary-foreground' },
  [UserRole.ADMIN]: { bg: 'bg-[var(--color-info-bg)]', text: 'text-[var(--color-info-text)]' },
  [UserRole.SUPER_ADMIN]: { bg: 'bg-primary/10', text: 'text-primary' },
};

/**
 * Helper to check if role1 is >= role2 in hierarchy
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all permissions for a role (including inherited from lower roles)
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
