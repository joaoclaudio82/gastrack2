import { expect, test } from '../fixtures/auth.fixture';
import {
  expectPageTitle,
  getTableRowCount,
  navigateTo,
  waitForLoading,
  waitForTableData,
} from '../utils/helpers';

test.describe('Inventário de Equipamentos - Acesso por Role', () => {
  test('USER não deve acessar inventário', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/inventory');

    // Deve redirecionar para forbidden ou dashboard
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN não deve acessar inventário', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/inventory');

    // Deve redirecionar para forbidden ou dashboard
    await expect(adminPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('SUPER_ADMIN deve acessar inventário', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await expectPageTitle(superAdminPage, /Equipamentos|Inventário|Inventory/i);
    await waitForTableData(superAdminPage);
  });
});

test.describe('Inventário de Equipamentos - SUPER_ADMIN', () => {
  test('deve listar todos os equipamentos', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await waitForTableData(superAdminPage);

    const rowCount = await getTableRowCount(superAdminPage);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('deve filtrar por tipo de equipamento', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await waitForTableData(superAdminPage);

    const typeFilter = superAdminPage.getByLabel(/Tipo|Type/i);
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      const firstOption = superAdminPage.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await waitForLoading(superAdminPage);
      }
    }
  });

  test('deve filtrar por kit', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await waitForLoading(superAdminPage);

    const kitFilter = superAdminPage.getByLabel(/Kit/i);
    if (await kitFilter.isVisible()) {
      await kitFilter.click();
      const firstOption = superAdminPage.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await waitForLoading(superAdminPage);
      }
    }
  });

  test('deve filtrar equipamentos não atribuídos', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await waitForTableData(superAdminPage);

    // Filtro de atribuição é um grupo de botões: Todos / Alocados / Em Estoque
    await superAdminPage.getByRole('button', { name: /Em Estoque/i }).click();
    await waitForLoading(superAdminPage);
  });

  test('deve criar novo equipamento', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await waitForLoading(superAdminPage);

    const createButton = superAdminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      const modal = superAdminPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Campos do formulário
      const assetTagField = modal.getByLabel(/Asset Tag|Patrimônio|Código/i);
      if (await assetTagField.isVisible()) {
        await assetTagField.fill(`EQUIP-E2E-${Date.now()}`);
      }

      // Tipo de equipamento
      const typeField = modal.getByLabel(/Tipo|Type/i);
      if (await typeField.isVisible()) {
        await typeField.click();
        const firstOption = superAdminPage.getByRole('option').first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
        }
      }
    }
  });

  test('deve atribuir equipamento a um kit', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/inventory');
    await waitForTableData(superAdminPage);

    // A atribuição é um botão direto "Atribuir", exibido só em linhas Em Estoque
    const assignButton = superAdminPage.getByRole('button', { name: /^Atribuir$/i }).first();

    if (!(await assignButton.isVisible().catch(() => false))) {
      test.skip(true, 'Nenhum equipamento em estoque para atribuir neste ambiente');
      return;
    }

    await assignButton.click();

    const modal = superAdminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Kit/i).first()).toBeVisible();
  });

  test('deve remover equipamento de um kit', () => {
    test.skip(true, 'Inventário não possui ação "remover do kit" (apenas Editar/Atribuir)');
  });

  test('deve transferir equipamento', () => {
    test.skip(true, 'Inventário não possui ação de transferência (apenas Editar/Atribuir)');
  });

  test('deve atribuir múltiplos equipamentos em batch', () => {
    test.skip(true, 'Inventário não possui seleção múltipla/ação em batch');
  });
});

test.describe('Histórico de Movimentação', () => {
  test('USER deve acessar histórico', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/history');
    await expectPageTitle(userPage, /Histórico|History/i);
  });

  test('deve listar movimentações', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/history');
    await waitForLoading(adminPage);

    // Pode ter dados ou não dependendo do estado do sistema
    const table = adminPage.locator('table');
    const emptyState = adminPage.locator('app-empty-state');

    const hasTable = await table.isVisible();
    const hasEmptyState = await emptyState.isVisible();

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('deve filtrar histórico por equipamento', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/history');
    await waitForLoading(adminPage);

    const equipmentFilter = adminPage.getByLabel(/Equipamento|Equipment/i);
    if (await equipmentFilter.isVisible()) {
      await equipmentFilter.click();
      const firstOption = adminPage.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await waitForLoading(adminPage);
      }
    }
  });

  test('deve filtrar histórico por kit', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/history');
    await waitForLoading(adminPage);

    const kitFilter = adminPage.getByLabel(/Kit/i);
    if (await kitFilter.isVisible()) {
      await kitFilter.click();
      const firstOption = adminPage.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await waitForLoading(adminPage);
      }
    }
  });

  test('SUPER_ADMIN deve ver histórico completo', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/history');
    await waitForLoading(superAdminPage);

    // SUPER_ADMIN vê todas as movimentações
    const table = superAdminPage.locator('table');
    if (await table.isVisible()) {
      await waitForTableData(superAdminPage);
    }
  });
});
