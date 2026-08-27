import { expect, test } from '../fixtures/auth.fixture';
import { expectPageTitle, navigateTo, waitForLoading } from '../utils/helpers';

const MODELS = '/admin/cylinder-models';
const PRICES = '/admin/gas-prices';

test.describe('Catálogo de modelos de cilindro - Acesso por Role', () => {
  test('USER não deve acessar catálogo', async ({ userPage }) => {
    await navigateTo(userPage, MODELS);
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN não deve acessar catálogo', async ({ adminPage }) => {
    await navigateTo(adminPage, MODELS);
    await expect(adminPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('SUPER_ADMIN deve acessar catálogo', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, MODELS);
    await expectPageTitle(superAdminPage, /Catálogo de Modelos de Cilindro/i);
  });
});

test.describe('Catálogo de modelos - SUPER_ADMIN', () => {
  test('deve listar modelos ou empty state', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, MODELS);
    await waitForLoading(superAdminPage);

    const rows = superAdminPage.locator('table tbody tr');
    const emptyState = superAdminPage.locator('app-empty-state');
    expect((await rows.count()) > 0 || (await emptyState.isVisible())).toBeTruthy();
  });

  test('deve abrir o formulário de novo modelo com tipo de gás e volume', async ({
    superAdminPage,
  }) => {
    await navigateTo(superAdminPage, MODELS);
    await waitForLoading(superAdminPage);

    // Botão do header e (quando vazio) o do empty-state têm o mesmo texto: use o primeiro.
    const createButton = superAdminPage.getByRole('button', { name: /Novo Modelo/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    const modal = superAdminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    // Modelo carrega gás + volume (dos quais o cilindro herda tudo).
    await expect(modal.getByText(/Tipo de gás/i).first()).toBeVisible();
  });
});

test.describe('Preços de gás - Acesso por Role', () => {
  test('USER não deve acessar preços de gás', async ({ userPage }) => {
    await navigateTo(userPage, PRICES);
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN não deve acessar preços de gás', async ({ adminPage }) => {
    await navigateTo(adminPage, PRICES);
    await expect(adminPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('SUPER_ADMIN deve acessar preços de gás', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, PRICES);
    await expectPageTitle(superAdminPage, /Preços de Gás/i);
  });
});

test.describe('Preços de gás - SUPER_ADMIN', () => {
  test('deve listar preços versionados ou empty state', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, PRICES);
    await waitForLoading(superAdminPage);

    const rows = superAdminPage.locator('table tbody tr');
    const emptyState = superAdminPage.locator('app-empty-state');
    expect((await rows.count()) > 0 || (await emptyState.isVisible())).toBeTruthy();
  });

  test('deve abrir o formulário de novo preço (empresa × gás × valor)', async ({
    superAdminPage,
  }) => {
    await navigateTo(superAdminPage, PRICES);
    await waitForLoading(superAdminPage);

    // "Novo Preço" só habilita depois de escolher uma empresa no combobox.
    const companyCombobox = superAdminPage.getByRole('combobox');
    await companyCombobox.click();
    const firstCompany = superAdminPage.getByRole('option').first();
    if (!(await firstCompany.isVisible().catch(() => false))) {
      test.skip(true, 'Nenhuma empresa cadastrada para habilitar o cadastro de preço');
    }
    await firstCompany.click();

    const createButton = superAdminPage.getByRole('button', { name: /Novo Preço/i }).first();
    await expect(createButton).toBeEnabled();
    await createButton.click();
    await expect(superAdminPage.locator('[role="dialog"]')).toBeVisible();
  });
});
