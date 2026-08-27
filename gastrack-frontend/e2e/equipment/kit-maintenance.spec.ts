import { expect, test } from '../fixtures/auth.fixture';
import { navigateTo, waitForLoading } from '../utils/helpers';

/**
 * Manutenção — trocar ESP / sensor (SUPER_ADMIN).
 *
 * O submit real muta hardware (provisiona/revoga credencial IoT), então estes testes
 * verificam a SUPERFÍCIE do fluxo — botões, abertura do modal, seleção do estoque e o
 * gate de validação — e sempre CANCELAM antes de confirmar. Requer um kit INSTALLED/MAINTENANCE.
 */
test.describe('Manutenção do kit - SUPER_ADMIN', () => {
  /**
   * Abre o detalhe do primeiro kit instalado; retorna false se não houver nenhum.
   * A aba "Instalados" já é o padrão da lista (só lista status INSTALLED) e cada linha
   * abre o detalhe pelo botão "Ver" (não há link/clique na própria linha).
   */
  async function openInstalledKitDetail(page: import('@playwright/test').Page): Promise<boolean> {
    await navigateTo(page, '/equipment/kits');
    await waitForLoading(page);

    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!hasRow) {
      return false;
    }

    await firstRow.getByRole('button', { name: 'Ver' }).click();
    await expect(page).toHaveURL(/\/equipment\/kits\/\d+/);
    await waitForLoading(page);
    return true;
  }

  test('mostra as ações de manutenção em um kit instalado', async ({ superAdminPage }) => {
    test.skip(!(await openInstalledKitDetail(superAdminPage)), 'Sem kit instalado no ambiente');

    await expect(superAdminPage.getByRole('button', { name: 'Trocar ESP' })).toBeVisible();
    await expect(superAdminPage.getByRole('button', { name: 'Trocar Sensor' })).toBeVisible();
  });

  test('abre o modal de trocar ESP e cancela sem mutar', async ({ superAdminPage }) => {
    test.skip(!(await openInstalledKitDetail(superAdminPage)), 'Sem kit instalado no ambiente');

    await superAdminPage.getByRole('button', { name: 'Trocar ESP' }).click();

    // Título do modal em modo ESP (h2 do app-modal).
    await expect(
      superAdminPage.getByRole('heading', { name: 'Trocar ESP (gateway)' }),
    ).toBeVisible();

    // O botão de confirmar começa desabilitado (nada selecionado) — ou há aviso de estoque vazio.
    const confirm = superAdminPage.getByRole('button', { name: 'Trocar ESP', exact: true }).last();
    await expect(confirm).toBeDisabled();

    await superAdminPage.getByRole('button', { name: 'Cancelar' }).click();
    await expect(
      superAdminPage.getByRole('heading', { name: 'Trocar ESP (gateway)' }),
    ).not.toBeVisible();
  });

  test('abre o modal de trocar sensor e cancela sem mutar', async ({ superAdminPage }) => {
    test.skip(!(await openInstalledKitDetail(superAdminPage)), 'Sem kit instalado no ambiente');

    await superAdminPage.getByRole('button', { name: 'Trocar Sensor' }).click();

    // Título via heading para não colidir com o texto do botão de confirmar ("Trocar sensor").
    await expect(superAdminPage.getByRole('heading', { name: 'Trocar sensor' })).toBeVisible();

    const confirm = superAdminPage
      .getByRole('button', { name: 'Trocar sensor', exact: true })
      .last();
    await expect(confirm).toBeDisabled();

    await superAdminPage.getByRole('button', { name: 'Cancelar' }).click();
  });
});
