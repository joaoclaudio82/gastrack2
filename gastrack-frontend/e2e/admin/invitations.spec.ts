import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/auth.fixture';
import { expectPageTitle, navigateTo, waitForLoading } from '../utils/helpers';

/**
 * O filtro de status da tela de convites é um app-select SEM label
 * (só placeholder "Filtrar por status"), renderizado como role="combobox".
 * Por isso o helper filterByStatus (que usa getByLabel(/Status/i)) não serve aqui.
 */
async function selectStatusFilter(page: Page, optionLabel: string | RegExp): Promise<void> {
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: optionLabel }).first().click();
  await waitForLoading(page);
}

test.describe('Convites - Acesso por Role', () => {
  test('USER não deve acessar convites', async ({ userPage }) => {
    await navigateTo(userPage, '/admin/invitations');
    await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
  });

  test('ADMIN deve acessar convites', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await expectPageTitle(adminPage, /Convites|Invitations/i);
  });

  test('SUPER_ADMIN deve acessar convites', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/invitations');
    await expectPageTitle(superAdminPage, /Convites|Invitations/i);
  });
});

test.describe('Convites - ADMIN', () => {
  test('deve listar convites', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    // Pode ter convites ou não
    const table = adminPage.locator('table');
    const emptyState = adminPage.locator('app-empty-state');

    const hasTable = await table.isVisible();
    const hasEmptyState = await emptyState.isVisible();

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('deve criar novo convite', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    // Header e empty-state têm o mesmo texto "Convidar Usuário"; usa o 1º (header)
    const createButton = adminPage.getByRole('button', { name: /Novo|Criar|Convidar/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    const modal = adminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Preenche email
    const emailField = modal.getByLabel(/Email/i);
    await emailField.fill(`e2e-invite-${Date.now()}@test.com`);

    // Seleciona role
    const roleField = modal.getByLabel(/Role|Perfil|Função/i);
    if (await roleField.isVisible()) {
      await roleField.click();
      const userOption = adminPage.getByRole('option', { name: /USER|Usuário/i });
      await userOption.click();
    }

    // Verifica que botão de enviar está visível
    const submitButton = modal.getByRole('button', { name: /Enviar|Convidar|Send/i });
    await expect(submitButton).toBeVisible();
  });

  test('deve validar email duplicado', () => {
    // Submeter o formulário dispara criação real de convite via Cognito (envia e-mail),
    // e a mensagem de "email já cadastrado" depende do texto exato do backend/Cognito.
    // Não roda de forma confiável local sem efeito colateral externo.
    test.skip(
      true,
      'Criar convite dispara Cognito real (e-mail) + erro de duplicado depende do backend',
    );
  });

  test('deve filtrar por status', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    await selectStatusFilter(adminPage, 'Pendente');

    const rows = adminPage.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      await expect(rows.first().getByText(/Pendente|PENDING/i)).toBeVisible();
    }
  });

  test('deve cancelar convite pendente', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    // Filtra por pendentes
    await selectStatusFilter(adminPage, 'Pendente');

    // Convites pendentes têm botões inline "Reenviar"/"Cancelar" na própria linha
    // (não há menu de ações). Só verifica visibilidade — cancelar dispara chamada real.
    const rows = adminPage.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      const cancelButton = rows.first().getByRole('button', { name: /Cancelar|Cancel/i });
      await expect(cancelButton).toBeVisible();
    }
  });

  test('deve reenviar convite pendente', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    await selectStatusFilter(adminPage, 'Pendente');

    // Botão inline "Reenviar" na linha do convite pendente. Só verifica visibilidade —
    // reenviar dispara Cognito real (envia e-mail), então não clicamos.
    const rows = adminPage.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      const resendButton = rows.first().getByRole('button', { name: /Reenviar|Resend/i });
      await expect(resendButton).toBeVisible();
    }
  });
});

test.describe('Convites - SUPER_ADMIN', () => {
  test('deve criar convite para qualquer empresa', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/invitations');
    await waitForLoading(superAdminPage);

    const createButton = superAdminPage
      .getByRole('button', { name: /Novo|Criar|Convidar/i })
      .first();
    await createButton.click();

    const modal = superAdminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // SUPER_ADMIN pode ter seletor de empresa
    const companyField = modal.getByLabel(/Empresa|Company/i);
    if (await companyField.isVisible()) {
      await companyField.click();
      const firstOption = superAdminPage.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }
  });

  test('deve criar convite com role ADMIN', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/admin/invitations');
    await waitForLoading(superAdminPage);

    const createButton = superAdminPage
      .getByRole('button', { name: /Novo|Criar|Convidar/i })
      .first();
    await createButton.click();

    const modal = superAdminPage.locator('[role="dialog"]');
    const roleField = modal.getByLabel(/Role|Perfil|Função/i);

    if (await roleField.isVisible()) {
      await roleField.click();

      // SUPER_ADMIN pode criar convites para ADMIN
      const adminOption = superAdminPage.getByRole('option', { name: /ADMIN|Administrador/i });
      await expect(adminOption).toBeVisible();
    }
  });
});

test.describe('Convites - Status', () => {
  test('deve exibir diferentes status de convites', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    // Abre o filtro de status (app-select sem label, role="combobox") e valida as opções
    await adminPage.getByRole('combobox').first().click();

    await expect(adminPage.getByRole('option', { name: /Pendente/i })).toBeVisible();
    await expect(adminPage.getByRole('option', { name: /Aceito/i })).toBeVisible();
    await expect(adminPage.getByRole('option', { name: /Expirado/i })).toBeVisible();
    await expect(adminPage.getByRole('option', { name: /Cancelado/i })).toBeVisible();
  });

  test('convites aceitos não devem ter ações', async ({ adminPage }) => {
    await navigateTo(adminPage, '/admin/invitations');
    await waitForLoading(adminPage);

    await selectStatusFilter(adminPage, 'Aceito');

    const rows = adminPage.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      const firstRow = rows.first();
      // Convites aceitos exibem "-" na coluna Ações, sem botões Cancelar/Reenviar
      await expect(firstRow.getByRole('button', { name: /Cancelar|Cancel/i })).toHaveCount(0);
      await expect(firstRow.getByRole('button', { name: /Reenviar|Resend/i })).toHaveCount(0);
    }
  });
});
