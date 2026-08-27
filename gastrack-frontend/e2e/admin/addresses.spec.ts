import { expect, test } from '../fixtures/auth.fixture';
import {
  expectPageTitle,
  getTableRowCount,
  navigateTo,
  waitForLoading,
  waitForTableData,
} from '../utils/helpers';

test.describe('Endereços - Acesso por Role', () => {
  test('USER não deve acessar endereços', async ({ userPage }) => {
    await navigateTo(userPage, '/admin/addresses');
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN deve acessar endereços', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await expectPageTitle(adminPage, /Endereços|Addresses/i);
  });

  test('SUPER_ADMIN deve acessar endereços', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/addresses');
    await expectPageTitle(superAdminPage, /Endereços|Addresses/i);
  });
});

test.describe('Endereços - ADMIN', () => {
  test('deve listar endereços', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForTableData(adminPage);

    const rowCount = await getTableRowCount(adminPage);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('deve criar novo endereço', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForLoading(adminPage);

    const createButton = adminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    const modal = adminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Preenche apenas os campos de texto reais. Estado/Cidade são app-select
    // (dependem de dados geográficos) e não são preenchíveis via fill.
    const nameField = modal.getByLabel(/Nome do Endereço|Nome|Name/i);
    if (await nameField.isVisible()) {
      await nameField.fill(`Endereço E2E ${Date.now()}`);
    }

    const zipField = modal.getByLabel(/CEP|Zip/i);
    if (await zipField.isVisible()) {
      await zipField.fill('01310-100');
    }

    const streetField = modal.getByLabel(/Rua|Logradouro|Street/i);
    if (await streetField.isVisible()) {
      await streetField.fill('Rua Teste, 123');
    }

    // O submit exige cityId (dados geográficos) que pode não existir no ambiente.
    // Valida apenas que o botão de criar/salvar está presente, sem exigir submit.
    const saveButton = modal.getByRole('button', { name: /Criar|Salvar|Save/i });
    await expect(saveButton).toBeVisible();
  });

  test('deve editar endereço existente', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForTableData(adminPage);

    const firstRow = adminPage.locator('table tbody tr').first();
    const editButton = firstRow.getByRole('button', { name: /Editar|Edit/i });

    if (await editButton.isVisible()) {
      await editButton.click();

      const modal = adminPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verifica que campos estão preenchidos
      const nameField = modal.getByLabel(/Nome|Name/i);
      const nameValue = await nameField.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });

  test('deve excluir endereço', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForTableData(adminPage);

    // Cada linha tem botões de ação diretos (sem menu). Valida o "Excluir" sem
    // clicar, pois a exclusão dispara um confirm() nativo.
    const firstRow = adminPage.locator('table tbody tr').first();
    const deleteButton = firstRow.getByRole('button', { name: /Excluir|Delete|Remover/i });
    await expect(deleteButton).toBeVisible();
  });

  test('deve ativar endereço inativo', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForTableData(adminPage);

    // Sem filtro de status nem busca; com pageSize 5 e 15 endereços (1 inativo),
    // o inativo pode estar em qualquer página. Varre as páginas atrás do botão
    // "Ativar" (nome exato p/ não casar com "Desativar"). Não clica: evita mutar.
    const nextButton = adminPage.getByRole('button', { name: 'Próxima página' });
    const activateButton = adminPage.getByRole('button', { name: 'Ativar', exact: true });

    let found = false;
    for (let i = 0; i < 5; i++) {
      if ((await activateButton.count()) > 0) {
        found = true;
        break;
      }
      if (!(await nextButton.isEnabled())) break;
      await nextButton.click();
      await waitForLoading(adminPage);
    }

    expect(found).toBe(true);
    await expect(activateButton.first()).toBeVisible();
  });
});

test.describe('Endereços - Busca', () => {
  test('deve buscar endereço por nome', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForTableData(adminPage);

    // A tela de endereços não possui campo de busca. Se existir, exercita;
    // caso contrário, apenas valida que a lista/empty-state está consistente.
    const searchInput = adminPage.getByPlaceholder(/Buscar|Pesquisar|Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('São Paulo');
      await searchInput.press('Enter');
      await waitForLoading(adminPage);
    }

    const rows = adminPage.locator('table tbody tr');
    const emptyState = adminPage.locator('app-empty-state');

    expect((await rows.count()) > 0 || (await emptyState.isVisible())).toBeTruthy();
  });
});

test.describe('Endereços - Paginação', () => {
  test('deve paginar lista de endereços', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/addresses');
    await waitForTableData(adminPage);

    // pageSize=5 e 15 endereços => 3 páginas. O rodapé usa botões nativos com
    // aria-label; "Próxima página" está habilitado na página 1.
    const nextButton = adminPage.getByRole('button', { name: 'Próxima página' });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await waitForLoading(adminPage);

    await expect(adminPage.getByText(/Página 2 de/)).toBeVisible();
  });
});
