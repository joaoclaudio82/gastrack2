import { expect, test } from '../fixtures/auth.fixture';
import { expectPageTitle, navigateTo, waitForLoading } from '../utils/helpers';

const ROUTE = '/analytics';

test.describe('Analytics de Pressão - Acesso por Role', () => {
  // Rota só com authGuard (sem data.roles) → todo autenticado acessa.
  test('USER deve acessar analytics', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await expectPageTitle(userPage, /Analytics de Pressão/i);
  });

  test('ADMIN deve acessar analytics', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await expectPageTitle(adminPage, /Analytics de Pressão/i);
  });

  test('SUPER_ADMIN deve acessar analytics', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, ROUTE);
    await expectPageTitle(superAdminPage, /Analytics de Pressão/i);
  });
});

test.describe('Analytics de Pressão - Navegação', () => {
  test('deve carregar o navegador sem erro', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    // Navegador renderiza (seletor de device/endereço ou empty state).
    const content = adminPage.locator('main');
    await expect(content).toBeVisible();
    // Nenhuma tela de erro.
    await expect(adminPage).not.toHaveURL(/\/errors/);
  });

  test('deve abrir o detalhe de pressão de um device quando houver', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    // Um link/cartão de device leva a /analytics/pressure/:deviceId.
    const deviceLink = adminPage.getByRole('link', { name: /pressão|device|ver|detalhe/i }).first();
    if (!(await deviceLink.isVisible().catch(() => false))) {
      test.skip(true, 'Sem device com leitura no ambiente');
    }
    await deviceLink.click();
    await expect(adminPage).toHaveURL(/\/analytics\/pressure\//);
  });
});
