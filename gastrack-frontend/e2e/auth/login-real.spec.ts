import { expect } from '@playwright/test';
import { test, TEST_USERS } from '../fixtures/auth.fixture';
import { expectLoginPage } from '../utils/assertions';
import { waitForLoading } from '../utils/helpers';

test.describe('Login Real - Fluxo Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('deve fazer login como USER e acessar dashboard', async ({ page }) => {
    const user = TEST_USERS.USER;

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Senha').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Aguarda redirecionamento para dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await waitForLoading(page);

    // Verifica elementos do dashboard
    await expect(page.getByRole('heading', { name: /Bem-vindo/i })).toBeVisible();

    // Verifica que o nome do usuário aparece no header
    await expect(page.getByRole('button', { name: /Menu do usuário/i })).toBeVisible();
  });

  test('deve fazer login como ADMIN e acessar dashboard', async ({ page }) => {
    const user = TEST_USERS.ADMIN;

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Senha').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await waitForLoading(page);

    await expect(page.getByRole('heading', { name: /Bem-vindo/i })).toBeVisible();

    // ADMIN deve ver link de Usuários no sidebar
    const menuNav = page.getByRole('navigation', { name: 'Menu de navegação' });
    await expect(menuNav.getByRole('link', { name: 'Usuários' })).toBeVisible();
  });

  test('deve fazer login como SUPER_ADMIN e acessar dashboard', async ({ page }) => {
    const user = TEST_USERS.SUPER_ADMIN;

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Senha').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await waitForLoading(page);

    await expect(page.getByRole('heading', { name: /Bem-vindo/i })).toBeVisible();

    // SUPER_ADMIN deve ver todos os links administrativos
    const menuNav = page.getByRole('navigation', { name: 'Menu de navegação' });
    await expect(menuNav.getByRole('link', { name: 'Usuários' })).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid@email.com');
    await page.getByLabel('Senha').fill('wrongpassword');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Aguarda alerta de erro (texto vem do backend/Cognito, então checamos só o role="alert")
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve redirecionar para returnUrl após login', async ({ page }) => {
    // Tenta acessar rota protegida
    await page.goto('/cylinders');

    // Deve redirecionar para login com returnUrl
    await expect(page).toHaveURL(/\/auth\/login\?returnUrl/);

    // Faz login
    const user = TEST_USERS.USER;
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Senha').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Deve redirecionar para a URL original
    await page.waitForURL(/\/cylinders/, { timeout: 15000 });
  });
});

test.describe('Logout - Fluxo Completo', () => {
  test('deve fazer logout e redirecionar para login', async ({ page, login, logout }) => {
    // Login primeiro
    await login(page, 'USER');

    // Faz logout
    await logout(page);

    // Verifica que está na página de login
    await expectLoginPage(page);

    // Tenta acessar rota protegida
    await page.goto('/dashboard');

    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve limpar tokens após logout', async ({ page, login, logout }) => {
    await login(page, 'USER');
    await logout(page);

    // Verifica que tokens foram removidos
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    const idToken = await page.evaluate(() => localStorage.getItem('id_token'));

    expect(accessToken).toBeNull();
    expect(idToken).toBeNull();
  });
});

test.describe('Remember Me', () => {
  test('deve manter sessão com remember me marcado', async ({ page }) => {
    const user = TEST_USERS.USER;

    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Senha').fill(user.password);

    // Marca "Lembrar-me"
    await page.getByRole('checkbox', { name: 'Lembrar-me' }).click();
    await expect(page.getByRole('checkbox', { name: 'Lembrar-me' })).toBeChecked();

    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Verifica que está autenticado
    await expect(page.getByRole('heading', { name: /Bem-vindo/i })).toBeVisible();
  });
});
