import { expect, test } from '../fixtures/auth.fixture';

const protectedSidebarRoutes: readonly { path: string; description: string }[] = [
  { path: '/admin/users', description: 'Usuários' },
  { path: '/admin/roles', description: 'Perfis de acesso' },
  { path: '/profile', description: 'Perfil do usuário' },
];

test.describe('Sidebar Navigation - rotas protegidas (sem autenticação)', () => {
  for (const route of protectedSidebarRoutes) {
    test(`deve redirecionar para login ao acessar ${route.description}`, async ({ page }) => {
      await page.goto(route.path);

      // Sempre deve redirecionar para login
      await expect(page).toHaveURL(/\/auth\/login/);

      // Confirma que estamos na tela de login
      await expect(page.getByRole('heading', { name: 'Inteligás', level: 1 })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Bem-vindo de volta', level: 2 }),
      ).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Senha')).toBeVisible();
    });
  }
});

test.describe('Sidebar Navigation - autenticado', () => {
  test('como USER, não deve exibir links de admin e deve permitir recolher/expandir o menu', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard');

    // Sidebar é um landmark de navegação
    const sidebar = userPage.getByRole('navigation', { name: 'Navegação principal' });
    await expect(sidebar).toBeVisible();

    // Links do grupo OBSERVAR (únicos visíveis para USER: Dashboard, Analytics, Pontos de Gás)
    const menuNav = userPage.getByRole('navigation', { name: 'Menu de navegação' });
    await expect(menuNav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Pontos de Gás' })).toBeVisible();

    // Itens dos grupos GERIR/PLATAFORMA (admin) não aparecem para USER
    await expect(menuNav.getByRole('link', { name: 'Usuários' })).toHaveCount(0);
    await expect(menuNav.getByRole('link', { name: 'Kits & Instalações' })).toHaveCount(0);
    await expect(menuNav.getByRole('link', { name: 'Histórico' })).toHaveCount(0);

    // Recolher/expandir via botão do rodapé do sidebar. O aria-label alterna entre
    // "Recolher menu lateral" e "Expandir menu lateral" conforme o estado, que depende
    // da largura inicial da viewport, então derivamos o rótulo esperado do estado atual.
    const toggleButton = sidebar.getByRole('button', { name: /menu lateral/ });
    await expect(toggleButton).toBeVisible();
    const labelBefore = await toggleButton.getAttribute('aria-label');
    const labelAfter =
      labelBefore === 'Recolher menu lateral' ? 'Expandir menu lateral' : 'Recolher menu lateral';
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-label', labelAfter);
  });

  test('como ADMIN, deve exibir link de Usuários e navegar para /admin/users', async ({
    adminPage,
  }) => {
    await adminPage.goto('/dashboard');

    const usersLink = adminPage.getByRole('link', { name: 'Usuários' });
    await expect(usersLink).toBeVisible();
    await usersLink.click();

    await expect(adminPage).toHaveURL(/\/admin\/users/);
  });
});
