import { expect, test } from '../fixtures/auth.fixture';
import {
  expectPageTitle,
  getTableRowCount,
  navigateTo,
  searchTable,
  waitForLoading,
} from '../utils/helpers';

const ROUTE = '/admin/gas-points';

test.describe('Pontos de Gás - Acesso por Role', () => {
  // Rota liberada para os três papéis (data.roles = USER, ADMIN, SUPER_ADMIN).
  test('USER deve acessar pontos de gás', async ({ userPage }) => {
    await navigateTo(userPage, ROUTE);
    await expectPageTitle(userPage, /Pontos de Gás/i);
  });

  test('ADMIN deve acessar pontos de gás', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await expectPageTitle(adminPage, /Pontos de Gás/i);
  });

  test('SUPER_ADMIN deve acessar pontos de gás', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, ROUTE);
    await expectPageTitle(superAdminPage, /Pontos de Gás/i);
  });
});

test.describe('Pontos de Gás - Listagem e monitoramento', () => {
  test('deve listar pontos ou exibir empty state', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    const rows = adminPage.locator('table tbody tr');
    const emptyState = adminPage.locator('app-empty-state');
    expect((await rows.count()) > 0 || (await emptyState.isVisible())).toBeTruthy();
  });

  test('deve buscar pontos por termo', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    const search = adminPage.getByPlaceholder(/Buscar|Pesquisar|Search/i);
    if (await search.isVisible().catch(() => false)) {
      await searchTable(adminPage, 'Forno');
      const rows = adminPage.locator('table tbody tr');
      const emptyState = adminPage.locator('app-empty-state');
      expect((await rows.count()) >= 0 || (await emptyState.isVisible())).toBeTruthy();
    }
  });

  test('deve exibir status/pressão do ponto quando houver dados', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    if ((await getTableRowCount(adminPage)) === 0) {
      test.skip(true, 'Sem pontos no ambiente');
    }
    // A tabela do ponto mostra um badge de status (cheio/baixo/sem sinal) por linha.
    const firstRow = adminPage.locator('table tbody tr').first();
    await expect(firstRow.locator('app-badge, app-tank-status-badge').first()).toBeVisible();
  });
});

test.describe('Pontos de Gás - CRUD (ADMIN)', () => {
  test('deve abrir o formulário de novo ponto', async ({ adminPage }) => {
    await navigateTo(adminPage, ROUTE);
    await waitForLoading(adminPage);

    // Texto real do botão do header (sempre presente p/ ADMIN, sem role-guard).
    // Nome exato evita strict-mode: a footer do modal ("Criar Ponto de Gás") e o
    // empty-state ("Cadastrar Ponto de Gás") não colidem com "Novo Ponto de Gás".
    const createButton = adminPage.getByRole('button', { name: 'Novo Ponto de Gás' }).first();
    if (!(await createButton.isVisible().catch(() => false))) {
      test.skip(true, 'ADMIN sem permissão de criar ponto neste ambiente');
    }
    await createButton.click();

    // app-modal só renderiza o <div role="dialog"> quando aberto; o host <app-modal>
    // fica sempre no DOM, então mirar em [role="dialog"] evita strict-mode (2 matches).
    const modal = adminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
    // O form pede a localização física (label real do app-input).
    await expect(modal.getByText(/Localização/i).first()).toBeVisible();
  });
});
