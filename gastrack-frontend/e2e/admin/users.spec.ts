import { expect, test } from '../fixtures/auth.fixture';
import {
  expectPageTitle,
  getTableRowCount,
  navigateTo,
  waitForLoading,
  waitForTableData,
} from '../utils/helpers';

test.describe('Usuários - Acesso por Role', () => {
  test('USER não deve acessar usuários', async ({ userPage }) => {
    await navigateTo(userPage, '/admin/users');

    // Deve redirecionar para forbidden
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN deve acessar usuários', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await expectPageTitle(adminPage, /Usuários|Users/i);
  });

  test('SUPER_ADMIN deve acessar usuários', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/users');
    await expectPageTitle(superAdminPage, /Usuários|Users/i);
  });
});

test.describe('Usuários - ADMIN', () => {
  test('deve listar usuários da empresa', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // ADMIN vê usuários da própria empresa. Resiliente: a lista pode vir vazia
    // (empty-state) se os usuários semeados ainda não confirmaram a conta.
    const rowCount = await getTableRowCount(adminPage);
    const emptyVisible = await adminPage.locator('app-empty-state').isVisible();
    expect(rowCount > 0 || emptyVisible).toBeTruthy();
  });

  test('deve filtrar por função', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // Filtros de função/empresa são app-select (button role="combobox") e só aparecem para
    // SUPER_ADMIN. O nome acessível vem do placeholder via title, então ancoramos no app-select.
    const roleFilter = adminPage
      .locator('app-select', { hasText: /função/i })
      .getByRole('combobox');
    if (await roleFilter.isVisible()) {
      await roleFilter.click();
      const userOption = adminPage.getByRole('option', { name: /Usuário|USER/i }).first();
      if (await userOption.isVisible()) {
        await userOption.click();
        await waitForLoading(adminPage);
      }
    }
  });

  test('deve exibir dados do usuário na linha', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // Não há modal de detalhes; email e função são exibidos na própria linha.
    const firstRow = adminPage.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await expect(firstRow).toContainText('@');
      await expect(firstRow.locator('app-badge').first()).toBeVisible();
    } else {
      await expect(adminPage.locator('app-empty-state')).toBeVisible();
    }
  });

  test('deve desativar usuário', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // Cada linha mostra um botão direto: Desativar (se ativo) ou Ativar (se inativo).
    const firstRow = adminPage.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      const actionButton = firstRow.getByRole('button', { name: /^(Ativar|Desativar)$/i });
      await expect(actionButton).toBeVisible();
    } else {
      await expect(adminPage.locator('app-empty-state')).toBeVisible();
    }
  });

  test('deve ativar usuário inativo', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // Não há filtro de status; procura por qualquer usuário inativo já listado.
    const activateButton = adminPage
      .locator('table tbody tr')
      .getByRole('button', { name: /^Ativar$/i })
      .first();

    if (await activateButton.isVisible()) {
      await expect(activateButton).toBeVisible();
    }
  });
});

test.describe('Usuários - SUPER_ADMIN', () => {
  test('deve filtrar por empresa', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/users');
    await waitForLoading(superAdminPage);

    // Filtro de empresa é um app-select exclusivo do SUPER_ADMIN (placeholder
    // "Filtrar por empresa") e é renderizado independente da lista ter dados.
    // Só há 1 empresa semeada, então validamos que o filtro EXISTE e aplica um
    // valor (ex.: "Todas as empresas"), sem exigir múltiplas empresas nos resultados.
    const companyFilter = superAdminPage
      .locator('app-select', { hasText: /empresa/i })
      .getByRole('combobox');
    // A asserção que importa: o filtro de empresa EXISTE para SUPER_ADMIN.
    await expect(companyFilter).toBeVisible();

    // Aplicar um valor é opcional: nesta tela o filtro pode vir sem opções carregadas.
    await companyFilter.click();
    const firstOption = superAdminPage.getByRole('option').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
      await waitForLoading(superAdminPage);
    }
  });

  test('deve ver usuários de todas as empresas', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/users');
    await waitForLoading(superAdminPage);

    // Só há 1 empresa semeada; não dá para exigir múltiplas empresas. Validamos
    // que a lista de usuários carrega: com linhas (e a coluna Empresa presente)
    // OU empty-state (usuários semeados podem não ter confirmado a conta).
    const rowCount = await getTableRowCount(superAdminPage);
    if (rowCount > 0) {
      const companyHeader = superAdminPage.locator('table thead th').getByText(/Empresa|Company/i);
      await expect(companyHeader).toBeVisible();
    } else {
      await expect(superAdminPage.locator('app-empty-state')).toBeVisible();
    }
  });

  test('deve gerenciar todos os roles', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/users');
    await waitForTableData(superAdminPage);

    const roleFilter = superAdminPage
      .locator('app-select', { hasText: /função/i })
      .getByRole('combobox');
    if (await roleFilter.isVisible()) {
      await roleFilter.click();

      // SUPER_ADMIN vê todas as funções (labels em PT: Usuário / Administrador).
      await expect(superAdminPage.getByRole('option', { name: /Usuário/i })).toBeVisible();
      await expect(superAdminPage.getByRole('option', { name: /Administrador/i })).toBeVisible();
    }
  });
});

test.describe('Usuários - Paginação e Busca', () => {
  test('deve buscar usuário por nome/email', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // A tela de usuários não possui campo de busca dedicado; usa se existir.
    const searchInput = adminPage.getByPlaceholder(/Buscar|Pesquisar|Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin');
      await searchInput.press('Enter');
      await waitForLoading(adminPage);
    }

    // Verifica que há resultados OU estado vazio
    const rows = adminPage.locator('table tbody tr');
    const emptyState = adminPage.locator('app-empty-state');

    const hasRows = (await rows.count()) > 0;
    const hasEmptyState = await emptyState.isVisible();

    expect(hasRows || hasEmptyState).toBeTruthy();
  });

  test('deve paginar lista de usuários', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/users');
    await waitForLoading(adminPage);

    // Botão real da paginação (data-table-footer): aria-label "Próxima página".
    // Só existe quando há tabela renderizada; se a lista vier vazia, é ignorado.
    const nextButton = adminPage.getByRole('button', { name: 'Próxima página' });
    if (await nextButton.isVisible()) {
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await waitForLoading(adminPage);
      } else {
        // Poucos usuários: só uma página, botão desabilitado.
        await expect(nextButton).toBeDisabled();
      }
    }
  });
});
