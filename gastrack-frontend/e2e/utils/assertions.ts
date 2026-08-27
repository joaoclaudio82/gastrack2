import { expect, type Page } from '@playwright/test';

/**
 * Asserts that the current page is the login page with all expected elements.
 * Validates URL pattern and key UI elements (headings, form fields, button).
 */
export async function expectLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole('heading', { name: 'Inteligás', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta', level: 2 })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
}
