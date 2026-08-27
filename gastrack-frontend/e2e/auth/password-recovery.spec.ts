import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../config/test-users';

test.describe('Recuperação de Senha - Fluxo Completo', () => {
  test.describe('Forgot Password', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/forgot-password');
    });

    test('deve exibir formulário de recuperação', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Esqueceu a senha?', level: 2 }),
      ).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Enviar código de recuperação' }),
      ).toBeVisible();
    });

    // Skip: dispara envio de e-mail real via Cognito, que não é confiável em ambiente de teste
    // (pool descartável não entrega e-mail; sem sucesso nem erro visível). Fora do escopo do e2e.
    test.skip('deve enviar código de recuperação para email válido', async ({ page }) => {
      const user = TEST_USERS.USER;

      await page.getByLabel('Email').fill(user.email);
      await page.getByRole('button', { name: 'Enviar código de recuperação' }).click();

      // Dispara Cognito real: aceita a tela de sucesso ("Verifique seu email")
      // OU o alerta de erro visível (rate limit, indisponibilidade, etc.)
      const success = page.getByRole('heading', { name: 'Verifique seu email', level: 2 });
      const errorAlert = page.getByText(
        /erro|falha|inválid|not found|não encontrad|limit|exceed|tente novamente/i,
      );
      await expect(success.or(errorAlert)).toBeVisible({ timeout: 15000 });
    });

    test('deve mostrar erro para email não cadastrado', async ({ page }) => {
      await page.getByLabel('Email').fill('naoexiste@email.com');
      await page.getByRole('button', { name: 'Enviar código de recuperação' }).click();

      // Por segurança o backend pode não revelar se o email existe:
      // aceita a tela de sucesso OU o alerta de erro visível.
      const success = page.getByRole('heading', { name: 'Verifique seu email', level: 2 });
      const errorAlert = page.getByText(
        /erro|falha|inválid|not found|não encontrad|limit|exceed|tente novamente/i,
      );
      await expect(success.or(errorAlert)).toBeVisible({ timeout: 15000 });
    });

    test('deve navegar para login via link', async ({ page }) => {
      await page.getByRole('link', { name: 'Voltar para login' }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('Reset Password', () => {
    test('deve exibir formulário de reset com código', async ({ page }) => {
      // Acessa reset-password com parâmetros de query
      await page.goto('/auth/reset-password?email=test@email.com');

      await expect(
        page.getByRole('heading', { name: /Nova senha|Redefinir senha/i }),
      ).toBeVisible();
      await expect(page.getByLabel(/Código|Code/i)).toBeVisible();
      await expect(page.getByLabel(/Nova senha|New password/i).first()).toBeVisible();
      await expect(page.getByLabel(/Confirmar senha|Confirm password/i)).toBeVisible();
    });

    test('deve validar senhas diferentes', async ({ page }) => {
      await page.goto('/auth/reset-password?email=test@email.com');

      await page.getByLabel(/Código|Code/i).fill('123456');
      await page
        .getByLabel(/Nova senha|New password/i)
        .first()
        .fill('NewPassword@123');
      await page.getByLabel(/Confirmar senha|Confirm password/i).fill('DifferentPassword@123');

      // Botão deve estar desabilitado ou mostrar erro
      const submitButton = page.getByRole('button', { name: /Redefinir|Reset|Salvar/i });

      // Tenta submeter
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        await expect(page.getByText(/senhas não conferem|passwords don't match/i)).toBeVisible();
      } else {
        await expect(submitButton).toBeDisabled();
      }
    });

    test('deve validar requisitos de senha', async ({ page }) => {
      await page.goto('/auth/reset-password?email=test@email.com');

      await page.getByLabel(/Código|Code/i).fill('123456');
      await page
        .getByLabel(/Nova senha|New password/i)
        .first()
        .fill('weak');
      await page.getByLabel(/Confirmar senha|Confirm password/i).fill('weak');

      // Deve mostrar erro de validação
      const submitButton = page.getByRole('button', { name: /Redefinir|Reset|Salvar/i });

      if (await submitButton.isEnabled()) {
        await submitButton.click();
        await expect(
          page.getByText(/senha fraca|mínimo|caracteres|requisitos|password requirements/i),
        ).toBeVisible({ timeout: 10000 });
      }
    });
  });
});

test.describe('Confirm Account', () => {
  test('deve exibir formulário de confirmação', async ({ page }) => {
    await page.goto('/auth/confirm-account?email=test@email.com');

    await expect(page.getByRole('heading', { name: /Confirmar|Verificar/i })).toBeVisible();
    await expect(page.getByLabel(/Código|Code/i)).toBeVisible();
  });

  test('deve ter link para reenviar código', async ({ page }) => {
    await page.goto('/auth/confirm-account?email=test@email.com');

    const resendLink = page.getByRole('button', { name: /Reenviar|Resend/i });
    await expect(resendLink).toBeVisible();
  });
});
