import { expect, test } from '../fixtures/auth.fixture';
import { navigateTo, waitForLoading } from '../utils/helpers';

const ROUTE = '/admin/onboarding';

test.describe('Onboarding (instalação guiada) - Acesso por Role', () => {
  test('USER não deve acessar onboarding', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN não deve acessar onboarding', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await expect(adminPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('SUPER_ADMIN deve acessar onboarding', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, ROUTE);
    await expect(superAdminPage).toHaveURL(/\/admin\/onboarding/);
  });
});

test.describe('Onboarding - Wizard', () => {
  test('deve renderizar o wizard começando pelo passo de empresa', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, ROUTE);
    await waitForLoading(superAdminPage);

    // O fluxo guiado começa no passo Empresa (uma ação por tela).
    await expect(superAdminPage.locator('app-onboarding-step-company')).toBeVisible();
  });

  test('não deve concluir a instalação sem completar os passos (superfície)', async ({
    superAdminPage,
  }) => {
    await navigateTo(superAdminPage, ROUTE);
    await waitForLoading(superAdminPage);

    // O passo final (install) não deve estar visível já de cara — o wizard é sequencial.
    await expect(superAdminPage.locator('app-onboarding-step-install')).toHaveCount(0);
  });
});
