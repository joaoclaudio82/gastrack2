import { expect, test } from '@playwright/test';

test.describe('Página Esqueceu a senha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
  });

  test('deve exibir formulário de recuperação de senha', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Inteligás', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Esqueceu a senha?', level: 2 })).toBeVisible();
    await expect(
      page.getByText('Digite seu email e enviaremos um código de recuperação'),
    ).toBeVisible();

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar código de recuperação' })).toBeVisible();
  });

  test('deve manter botão desabilitado quando o email está vazio', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Enviar código de recuperação' })).toBeDisabled();
  });

  test('deve habilitar botão quando o email é válido', async ({ page }) => {
    await page.getByLabel('Email').fill('usuario@gastrack.local');
    await expect(page.getByRole('button', { name: 'Enviar código de recuperação' })).toBeEnabled();
  });

  test('deve ter link Voltar para login', async ({ page }) => {
    await page.getByRole('link', { name: 'Voltar para login' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
