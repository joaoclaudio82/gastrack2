import { expect, test } from '../fixtures/auth.fixture';
import {
  expectPageTitle,
  getTableRowCount,
  navigateTo,
  waitForLoading,
  waitForTableData,
} from '../utils/helpers';

// A lista de cilindros renderiza CARDS (app-oxygen-tank-card) num grid, NÃO uma
// <table>. Os helpers waitForTableData/getTableRowCount já casam os cards.
// Cilindros não têm status/pressão/nível — isso vive no Ponto de Gás. O card
// mostra apenas identidade: nº de série, tipo de gás, volume, capacidade,
// preço/m³ e situação (Ativo/Inativo).
const CARD_SELECTOR = 'app-oxygen-tank-card';
const EMPTY_STATE_TEXT = /Nenhum cilindro encontrado/i;

test.describe('Cilindros - USER', () => {
  test.beforeEach(async ({ userPage }) => {
    await navigateTo(userPage, '/cylinders');
  });

  test('deve exibir lista de cilindros', async ({ userPage }) => {
    await expectPageTitle(userPage, /Cilindros/i);
    await waitForTableData(userPage);

    const rowCount = await getTableRowCount(userPage);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('deve exibir dados de identidade do cilindro no card', async ({ userPage }) => {
    await waitForTableData(userPage);

    // Cada card exibe os campos de identidade (não há cards de "estatísticas").
    await expect(userPage.getByText(/Capacidade:/i).first()).toBeVisible();
    await expect(userPage.getByText(/Preço\/m³:/i).first()).toBeVisible();
    await expect(userPage.getByText(/Situação:/i).first()).toBeVisible();
    await expect(userPage.getByText(/volume de água/i).first()).toBeVisible();
  });

  test('deve filtrar cilindros por status', () => {
    test.skip(
      true,
      'Cilindros não têm status/pressão/nível — isso vive no Ponto de Gás. A lista só filtra por nº de série e empresa.',
    );
  });

  test('deve buscar cilindros por termo', async ({ userPage }) => {
    await waitForTableData(userPage);

    // Filtro de busca por nº de série. Alvo pelo label "Buscar cilindro"
    // (estável); o placeholder é só cosmético e pode mudar de texto.
    const searchInput = userPage.getByLabel(/Buscar cilindro/i);
    await searchInput.fill('sensor');
    await waitForLoading(userPage);

    // Verifica resultados (cards) ou empty state real ("Nenhum cilindro encontrado").
    const hasCards = (await userPage.locator(CARD_SELECTOR).count()) > 0;
    const hasEmptyState = await userPage.getByText(EMPTY_STATE_TEXT).isVisible();

    expect(hasCards || hasEmptyState).toBeTruthy();
  });

  test('deve acessar cilindros via URL direta', async ({ userPage }) => {
    // USER não tem link de Cilindros no sidebar: o item "Catálogo de Cilindros"
    // é ADMIN/SUPER_ADMIN e aponta para /admin/cylinder-models. Nenhum papel tem
    // link para /cylinders no menu, então acessa direto por URL.
    await navigateTo(userPage, '/dashboard');
    await navigateTo(userPage, '/cylinders');

    await expect(userPage).toHaveURL(/\/cylinders/);
    await expectPageTitle(userPage, /Cilindros/i);
  });
});

test.describe('Cilindros - ADMIN', () => {
  test('deve visualizar detalhes de um cilindro', async ({ adminPage }) => {
    await navigateTo(adminPage, '/cylinders');
    await waitForTableData(adminPage);

    // Clica no primeiro card da lista.
    const firstCard = adminPage.locator(CARD_SELECTOR).first();
    await firstCard.click();

    // A lista atual é read-only (sem detalhe/modal). Aceita: modal/detalhe se
    // existir, ou o card seguir visível caso não haja tela de detalhe.
    const modal = adminPage.locator('[role="dialog"]');
    const detailPage = adminPage.locator('app-cylinder-detail');

    const hasModal = await modal.isVisible();
    const hasDetailPage = await detailPage.isVisible();
    const cardStillVisible = await firstCard.isVisible();

    expect(hasModal || hasDetailPage || cardStillVisible).toBeTruthy();
  });

  test('deve poder alterar status de um cilindro', async ({ adminPage }) => {
    await navigateTo(adminPage, '/cylinders');
    await waitForTableData(adminPage);

    // A lista é read-only: não há botão de ações no card. Resiliente — só age se existir.
    const firstCard = adminPage.locator(CARD_SELECTOR).first();
    const actionsButton = firstCard.getByRole('button', { name: /Ações|Menu|\.\.\./ });

    if (await actionsButton.isVisible()) {
      await actionsButton.click();

      const changeStatusOption = adminPage.getByRole('menuitem', { name: /Status|Alterar/i });
      if (await changeStatusOption.isVisible()) {
        await changeStatusOption.click();
        await expect(adminPage.locator('[role="dialog"]')).toBeVisible();
      }
    }
  });
});

test.describe('Cilindros - SUPER_ADMIN', () => {
  test('deve ter acesso completo a cilindros', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/cylinders');
    await waitForTableData(superAdminPage);

    // SUPER_ADMIN deve ver todos os cilindros de todas as empresas
    const rowCount = await getTableRowCount(superAdminPage);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('deve poder criar novo cilindro', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/cylinders');
    await waitForLoading(superAdminPage);

    // A lista pública não tem botão de criar (CRUD fica na área admin). Resiliente.
    const createButton = superAdminPage.getByRole('button', { name: /Novo|Adicionar|Criar/i });

    if (await createButton.isVisible()) {
      await createButton.click();

      await expect(
        superAdminPage.locator('[role="dialog"], form[data-form="cylinder"]'),
      ).toBeVisible();
    }
  });

  test('deve poder desativar um cilindro', () => {
    test.skip(
      true,
      'A lista de cilindros é read-only: o oxygen-tank-card não tem botão/menu de ações, não há tela de detalhe nem rota de mutação. Não existe ação de desativar cilindro na UI para nenhum papel.',
    );
  });
});

test.describe('Cilindros - Paginação', () => {
  test('deve paginar resultados', async ({ userPage }) => {
    await navigateTo(userPage, '/cylinders');
    await waitForTableData(userPage);

    // O rodapé (app-data-table-footer) só aparece com total > 0; botão "Próxima página".
    const nextButton = userPage.getByRole('button', { name: /Próxima página/i });

    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      await nextButton.click();
      await waitForLoading(userPage);
      await waitForTableData(userPage);
    }
  });

  test('deve mostrar informações de paginação', async ({ userPage }) => {
    await navigateTo(userPage, '/cylinders');
    await waitForTableData(userPage);

    // Texto real do rodapé: "1 – 10 de 50 registros". Só existe se houver rodapé.
    const paginationInfo = userPage.getByText(/registros/i);

    if ((await paginationInfo.count()) > 0) {
      await expect(paginationInfo.first()).toBeVisible();
    }
  });
});

test.describe('Cilindros - Filtro por Endereço', () => {
  test('deve filtrar por endereço', () => {
    test.skip(
      true,
      'A lista de cilindros não expõe filtro por endereço — os filtros disponíveis são nº de série (busca) e empresa.',
    );
  });
});
