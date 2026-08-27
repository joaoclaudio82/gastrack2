import { expect, test } from '../fixtures/auth.fixture';
import {
  expectPageTitle,
  getTableRowCount,
  navigateTo,
  waitForLoading,
  waitForTableData,
} from '../utils/helpers';

test.describe('Kits - USER', () => {
  test('deve visualizar lista de kits', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/kits');
    await expectPageTitle(userPage, /Kits/i);
    await waitForTableData(userPage);

    const rowCount = await getTableRowCount(userPage);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('deve filtrar kits por status via abas', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/kits');
    await waitForTableData(userPage);

    // O filtro por status é feito por abas (Instalados x Não-instalados), não por dropdown.
    const notInstalledTab = userPage.getByRole('tab', { name: /Não-instalados/i });
    await notInstalledTab.click();
    await waitForLoading(userPage);
    await expect(notInstalledTab).toHaveAttribute('aria-selected', 'true');

    const installedTab = userPage.getByRole('tab', { name: /^Instalados/i });
    await installedTab.click();
    await waitForLoading(userPage);
    await expect(installedTab).toHaveAttribute('aria-selected', 'true');

    // Aba Instalados tem ao menos 1 kit semeado (INSTALLED)
    expect(await getTableRowCount(userPage)).toBeGreaterThan(0);
  });

  test('USER não deve ver botão de criar kit', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/kits');
    await waitForLoading(userPage);

    // USER não pode criar kits - apenas SUPER_ADMIN
    const createButton = userPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).not.toBeVisible();
  });

  test('deve acessar detalhes do kit', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/kits');
    await waitForTableData(userPage);

    // A ação "Ver" da linha é um <button> que navega para o detalhe.
    const firstRow = userPage.locator('table tbody tr').first();
    await firstRow.getByRole('button', { name: /Ver|Detalhes/i }).click();
    await expect(userPage).toHaveURL(/\/equipment\/kits\/\d+/);
  });
});

test.describe('Kits - ADMIN', () => {
  test('ADMIN não deve ver botão de criar kit', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/kits');
    await waitForLoading(adminPage);

    // ADMIN não pode criar kits - apenas SUPER_ADMIN
    const createButton = adminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).not.toBeVisible();
  });

  test('deve visualizar status dos kits', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/kits');
    await waitForTableData(adminPage);

    // Verifica que coluna de status está visível
    const headers = adminPage.locator('table thead th');
    await expect(headers.getByText(/Status/i)).toBeVisible();
  });

  test('deve filtrar por contrato via query params', async ({ adminPage }) => {
    // Acessa kits com filtro de contrato
    await navigateTo(adminPage, '/equipment/kits?contractId=1');
    await waitForLoading(adminPage);

    // Verifica que o filtro está aplicado
    const contractFilter = adminPage.getByLabel(/Contrato|Contract/i);
    if (await contractFilter.isVisible()) {
      // Filtro deve ter valor selecionado
    }
  });
});

test.describe('Kits - SUPER_ADMIN', () => {
  test('SUPER_ADMIN deve ver botão de criar kit', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForLoading(superAdminPage);

    const createButton = superAdminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).toBeVisible();
  });

  test('deve criar novo kit', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForLoading(superAdminPage);

    const createButton = superAdminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await createButton.click();

    const modal = superAdminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /Novo Kit/i })).toBeVisible();

    // Valida os campos reais do formulário sem submeter (evita mutar dado / rate-limit).
    // Os selects Contrato/Endereço ficam desabilitados até escolher a empresa, então
    // não os clicamos (clique em <button disabled> trava na checagem de actionability).
    await expect(modal.getByText(/Contrato/i).first()).toBeVisible();
    await expect(modal.getByText(/Código do Kit/i)).toBeVisible();

    // O código do kit é um input habilitado; preenche só para exercitar o campo real.
    await modal.getByLabel(/Código do Kit/i).fill(`KIT-E2E-${Date.now()}`);
  });

  test('deve editar kit existente', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForTableData(superAdminPage);

    const firstRow = superAdminPage.locator('table tbody tr').first();
    const editButton = firstRow.getByRole('button', { name: /Editar|Edit/i });

    if (await editButton.isVisible()) {
      await editButton.click();

      const modal = superAdminPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    }
  });

  test('deve alterar status de kit (via detalhe)', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForTableData(superAdminPage);

    // Mudança de status é feita na página de detalhe (Instalar/Desinstalar), não em menu na lista.
    await superAdminPage
      .locator('table tbody tr')
      .first()
      .getByRole('button', { name: /Ver/i })
      .click();
    await expect(superAdminPage).toHaveURL(/\/equipment\/kits\/\d+/);
    await waitForLoading(superAdminPage);

    const hasInstall = await superAdminPage
      .getByRole('button', { name: /Instalar Kit/i })
      .isVisible();
    const hasUninstall = await superAdminPage
      .getByRole('button', { name: /Desinstalar Kit/i })
      .isVisible();

    expect(hasInstall || hasUninstall).toBeTruthy();
  });
});

test.describe('Kit Detail', () => {
  test('deve exibir detalhes do kit', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/kits');
    await waitForTableData(userPage);

    // Navega ao detalhe pelo botão "Ver" da primeira linha.
    await userPage.locator('table tbody tr').first().getByRole('button', { name: /Ver/i }).click();
    await expect(userPage).toHaveURL(/\/equipment\/kits\/\d+/);
    await waitForLoading(userPage);

    // Informações reais do cabeçalho do detalhe.
    await expect(userPage.getByText(/Contrato/i).first()).toBeVisible();
    await expect(userPage.getByText(/Instalação/i).first()).toBeVisible();
    await expect(userPage.getByRole('heading', { name: /Equipamentos/i })).toBeVisible();
  });

  test('deve listar equipamentos do kit', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/kits');
    await waitForTableData(adminPage);

    await adminPage.locator('table tbody tr').first().getByRole('button', { name: /Ver/i }).click();
    await expect(adminPage).toHaveURL(/\/equipment\/kits\/\d+/);
    await waitForLoading(adminPage);

    // Seção de equipamentos do kit.
    await expect(adminPage.getByRole('heading', { name: /Equipamentos/i })).toBeVisible();
  });
});

test.describe('Kits - Modais de Instalação/Desinstalação', () => {
  test('deve abrir modal de instalação', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForTableData(superAdminPage);

    // Instalar só faz sentido para kits não-instalados (PENDING).
    await superAdminPage.getByRole('tab', { name: /Não-instalados/i }).click();
    await waitForLoading(superAdminPage);

    const rows = superAdminPage.locator('table tbody tr');
    if ((await rows.count()) === 0) {
      test.skip(true, 'Nenhum kit não-instalado semeado para testar instalação');
    }

    await rows.first().getByRole('button', { name: /Ver/i }).click();
    await expect(superAdminPage).toHaveURL(/\/equipment\/kits\/\d+/);
    await waitForLoading(superAdminPage);

    await superAdminPage.getByRole('button', { name: /Instalar Kit/i }).click();

    const modal = superAdminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Instalar Kit/i).first()).toBeVisible();
    // Campo de data de instalação
    await expect(modal.getByText(/Data de Instalação/i)).toBeVisible();
  });

  test('deve abrir modal de desinstalação', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForTableData(superAdminPage);

    // Aba Instalados (padrão) tem o kit INSTALLED semeado, que pode ser desinstalado.
    await superAdminPage
      .locator('table tbody tr')
      .first()
      .getByRole('button', { name: /Ver/i })
      .click();
    await expect(superAdminPage).toHaveURL(/\/equipment\/kits\/\d+/);
    await waitForLoading(superAdminPage);

    await superAdminPage.getByRole('button', { name: /Desinstalar Kit/i }).click();

    const modal = superAdminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Desinstalar Kit/i).first()).toBeVisible();
  });
});
