import { test as base, type Page } from '@playwright/test';
import { TEST_USERS, type TestUserRole } from '../config/test-users';
import { authStatePath } from '../global-setup';

/**
 * Gets a test user by role
 */
function getTestUser(role: TestUserRole) {
  return TEST_USERS[role];
}

/**
 * Performs real login via the UI
 */
async function loginViaUI(page: Page, role: TestUserRole): Promise<void> {
  const user = getTestUser(role);

  await page.goto('/auth/login');

  // Fill credentials
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Senha').fill(user.password);

  // Submit
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

/**
 * Extended test fixtures with authenticated contexts
 */
type AuthFixtures = {
  /** Page authenticated as USER */
  userPage: Page;
  /** Page authenticated as ADMIN */
  adminPage: Page;
  /** Page authenticated as SUPER_ADMIN */
  superAdminPage: Page;
  /** Login helper function */
  login: (page: Page, role: TestUserRole) => Promise<void>;
  /** Logout helper function */
  logout: (page: Page) => Promise<void>;
};

/**
 * Test fixture with authentication helpers
 */
export const test = base.extend<AuthFixtures>({
  // Login helper
  login: async ({}, use) => {
    await use(async (page: Page, role: TestUserRole) => {
      await loginViaUI(page, role);
    });
  },

  // Logout helper
  logout: async ({}, use) => {
    await use(async (page: Page) => {
      // Click user menu
      const userMenuButton = page.getByRole('button', { name: /Menu do usuário/i });
      await userMenuButton.click();

      // Click logout
      await page.getByRole('menuitem', { name: 'Sair' }).click();

      // Wait for redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    });
  },

  // Authenticated page as USER (reusa o storageState do global-setup)
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authStatePath('USER') });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Authenticated page as ADMIN
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authStatePath('ADMIN') });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Authenticated page as SUPER_ADMIN
  superAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authStatePath('SUPER_ADMIN') });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
export { TEST_USERS };
