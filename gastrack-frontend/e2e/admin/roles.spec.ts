import { expect, test } from '../fixtures/auth.fixture';
import { expectPageTitle, navigateTo, waitForLoading } from '../utils/helpers';

const ROUTE = '/admin/roles';

test.describe('Funções - Acesso por Role', () => {
  test('USER não deve acessar funções', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN deve acessar funções', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await expectPageTitle(adminPage, /Funções/i);
  });

  test('SUPER_ADMIN deve acessar funções', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, ROUTE);
    await expectPageTitle(superAdminPage, /Funções/i);
  });
});

test.describe('Funções - Listagem', () => {
  test('deve listar as funções ou exibir empty state', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    // A tela renderiza cards de função num grid (não tabela); cada card tem botão "Editar".
    const cards = adminPage.getByRole('button', { name: 'Editar' });
    const emptyState = adminPage.locator('app-empty-state');
    expect((await cards.count()) > 0 || (await emptyState.isVisible())).toBeTruthy();
  });
});
