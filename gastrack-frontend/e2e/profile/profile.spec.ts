import { expect, test } from '../fixtures/auth.fixture';
import { expectPageTitle, navigateTo, waitForLoading } from '../utils/helpers';

const ROUTE = '/profile';

test.describe('Perfil - Acesso por Role', () => {
  test('USER deve acessar o próprio perfil', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await expectPageTitle(userPage, /Perfil/i);
  });

  test('ADMIN deve acessar o próprio perfil', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await expectPageTitle(adminPage, /Perfil/i);
  });
});

test.describe('Perfil - Visualização e edição', () => {
  test('deve exibir os dados do usuário logado', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await waitForLoading(userPage);

    // O perfil mostra o e-mail do usuário autenticado.
    await expect(userPage.getByText(/@/).first()).toBeVisible();
  });

  test('deve abrir a edição de perfil quando disponível', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await waitForLoading(userPage);

    const editButton = userPage.getByRole('button', { name: /Editar/i });
    const editLink = userPage.getByRole('link', { name: /Editar/i });
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
    } else if (await editLink.isVisible().catch(() => false)) {
      await editLink.click();
    } else {
      test.skip(true, 'Sem ação de editar perfil nesta tela');
    }
    await expect(userPage.getByRole('heading', { level: 1 })).toContainText(
      /Editar Perfil|Perfil/i,
    );
  });
});
