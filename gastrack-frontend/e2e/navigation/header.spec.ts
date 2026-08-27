import { expect, test } from '../fixtures/auth.fixture';

test.describe('Header Navigation - rota protegida (sem autenticação)', () => {
  test('deve redirecionar para login ao tentar acessar o dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Redireciona para login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Garante que estamos na tela de login
    await expect(page.getByRole('heading', { name: 'Inteligás', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta', level: 2 })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
  });
});

test.describe('Header Navigation - autenticado', () => {
  // Login real (a fixture userPage), não mockAuth: o backend real rejeita token fake (401).
  test('deve exibir botão de menu e menu do usuário', async ({ userPage }) => {
    await userPage.goto('/dashboard');

    await expect(userPage.getByRole('button', { name: 'Alternar menu lateral' })).toBeVisible();

    const userMenuButton = userPage.getByRole('button', { name: /Menu do usuário/i });
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    await expect(userPage.getByRole('menu')).toBeVisible();
    await expect(userPage.getByRole('menuitem', { name: 'Perfil' })).toBeVisible();
    await expect(userPage.getByRole('menuitem', { name: 'Sair' })).toBeVisible();
  });

  test('deve navegar para Perfil via menu do usuário', async ({ userPage }) => {
    await userPage.goto('/dashboard');

    const userMenuButton = userPage.getByRole('button', { name: /Menu do usuário/i });
    await userMenuButton.click();

    await userPage.getByRole('menuitem', { name: 'Perfil' }).click();
    await expect(userPage).toHaveURL(/\/profile/);
  });
});
