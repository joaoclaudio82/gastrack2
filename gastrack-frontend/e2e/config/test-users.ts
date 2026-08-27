/**
 * Test user credentials for E2E tests.
 * These users must exist in the backend database.
 *
 * IMPORTANT: Create these users in your test environment before running E2E tests.
 */
export interface TestUser {
  readonly email: string;
  readonly password: string;
  readonly role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  readonly firstName: string;
  readonly lastName: string;
}

/**
 * Test users for each role.
 * Update these credentials to match your test environment.
 */
export const TEST_USERS = {
  USER: {
    email: process.env['E2E_USER_EMAIL'] ?? 'e2e.user@gastrack.local',
    password: process.env['E2E_USER_PASSWORD'] ?? 'Test@123456',
    role: 'USER' as const,
    firstName: 'E2E',
    lastName: 'User',
  },
  ADMIN: {
    email: process.env['E2E_ADMIN_EMAIL'] ?? 'e2e.admin@gastrack.local',
    password: process.env['E2E_ADMIN_PASSWORD'] ?? 'Test@123456',
    role: 'ADMIN' as const,
    firstName: 'E2E',
    lastName: 'Admin',
  },
  SUPER_ADMIN: {
    email: process.env['E2E_SUPER_ADMIN_EMAIL'] ?? 'e2e.superadmin@gastrack.local',
    password: process.env['E2E_SUPER_ADMIN_PASSWORD'] ?? 'Test@123456',
    role: 'SUPER_ADMIN' as const,
    firstName: 'E2E',
    lastName: 'SuperAdmin',
  },
} as const;

export type TestUserRole = keyof typeof TEST_USERS;

/**
 * API base URL for direct API calls in tests
 */
export const API_BASE_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8080/api/v1';

/**
 * Frontend base URL
 */
export const APP_BASE_URL = process.env['E2E_APP_URL'] ?? 'http://localhost:4200';
