import { expect, test } from '@playwright/test';

test.describe('Página de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('deve exibir layout de auth com Inteligás e formulário de login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Inteligás', level: 1 })).toBeVisible();
    await expect(page.getByText('Sistema de Gerenciamento de Gás')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta', level: 2 })).toBeVisible();
    await expect(page.getByText('Entre na sua conta')).toBeVisible();

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('deve manter botão Entrar desabilitado quando o formulário está vazio', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  test('deve habilitar botão Entrar quando email e senha são válidos', async ({ page }) => {
    await page.getByLabel('Email').fill('usuario@gastrack.local');
    await page.getByLabel('Senha').fill('senha123');

    await expect(page.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  test('deve navegar para Esqueceu a senha ao clicar no link', async ({ page }) => {
    await page.getByRole('link', { name: 'Esqueceu a senha?' }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('deve exibir checkbox Lembrar-me desmarcado e permitir marcar', async ({ page }) => {
    const lembrarMe = page.getByRole('checkbox', { name: 'Lembrar-me' });
    await expect(lembrarMe).toBeVisible();
    await expect(lembrarMe).not.toBeChecked();

    await lembrarMe.click();
    await expect(lembrarMe).toBeChecked();
  });
});
