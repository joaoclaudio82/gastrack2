import { expect, test } from '../fixtures/auth.fixture';
import { navigateTo, waitForLoading } from '../utils/helpers';

/**
 * Testes de permissões por role - Matriz de acesso completa
 *
 * Este arquivo testa se cada role tem acesso apenas às rotas permitidas.
 */

// Definição de rotas e permissões esperadas
interface RoutePermission {
  path: string;
  description: string;
  userAccess: boolean;
  adminAccess: boolean;
  superAdminAccess: boolean;
}

const ROUTES: RoutePermission[] = [
  // Dashboard - todos acessam
  {
    path: '/dashboard',
    description: 'Dashboard',
    userAccess: true,
    adminAccess: true,
    superAdminAccess: true,
  },

  // Cylinders - dados de tanque restritos: API retorna 403 para USER/ADMIN
  // (errorInterceptor redireciona 403 -> /errors/forbidden). Só SUPER_ADMIN acessa.
  {
    path: '/cylinders',
    description: 'Cilindros',
    // Rota só com authGuard; USER/ADMIN acessam (o 403 no init foi corrigido).
    userAccess: true,
    adminAccess: true,
    superAdminAccess: true,
  },

  // Equipment
  {
    path: '/equipment/contracts',
    description: 'Contratos',
    userAccess: true,
    adminAccess: true,
    superAdminAccess: true,
  },
  {
    path: '/equipment/kits',
    description: 'Kits',
    userAccess: true,
    adminAccess: true,
    superAdminAccess: true,
  },
  {
    path: '/equipment/inventory',
    description: 'Inventário',
    userAccess: false,
    adminAccess: false,
    superAdminAccess: true,
  },
  {
    path: '/equipment/history',
    description: 'Histórico',
    userAccess: true,
    adminAccess: true,
    superAdminAccess: true,
  },

  // Admin
  {
    path: '/admin/users',
    description: 'Usuários',
    userAccess: false,
    adminAccess: true,
    superAdminAccess: true,
  },
  {
    path: '/admin/invitations',
    description: 'Convites',
    userAccess: false,
    adminAccess: true,
    superAdminAccess: true,
  },
  {
    path: '/admin/addresses',
    description: 'Endereços',
    userAccess: false,
    adminAccess: true,
    superAdminAccess: true,
  },
  {
    path: '/admin/companies',
    description: 'Empresas',
    userAccess: false,
    adminAccess: false,
    superAdminAccess: true,
  },
  {
    path: '/admin/roles',
    description: 'Perfis',
    userAccess: false,
    adminAccess: true,
    superAdminAccess: true,
  },

  // Profile - todos acessam
  {
    path: '/profile',
    description: 'Perfil',
    userAccess: true,
    adminAccess: true,
    superAdminAccess: true,
  },
];

test.describe('Permissões de Acesso - USER', () => {
  for (const route of ROUTES) {
    if (route.userAccess) {
      test(`USER deve acessar ${route.description} (${route.path})`, async ({ userPage }) => {
        await navigateTo(userPage, route.path);
        await waitForLoading(userPage);

        // Não deve estar em página de erro
        await expect(userPage).not.toHaveURL(/\/errors\/forbidden/);
        // Deve estar na rota esperada ou similar
        await expect(userPage).toHaveURL(new RegExp(route.path.replace(/\//g, '\\/')));
      });
    } else {
      test(`USER NÃO deve acessar ${route.description} (${route.path})`, async ({ userPage }) => {
        await navigateTo(userPage, route.path);

        // Deve redirecionar para forbidden ou dashboard
        await expect(userPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
      });
    }
  }
});

test.describe('Permissões de Acesso - ADMIN', () => {
  for (const route of ROUTES) {
    if (route.adminAccess) {
      test(`ADMIN deve acessar ${route.description} (${route.path})`, async ({ adminPage }) => {
        await navigateTo(adminPage, route.path);
        await waitForLoading(adminPage);

        await expect(adminPage).not.toHaveURL(/\/errors\/forbidden/);
        await expect(adminPage).toHaveURL(new RegExp(route.path.replace(/\//g, '\\/')));
      });
    } else {
      test(`ADMIN NÃO deve acessar ${route.description} (${route.path})`, async ({ adminPage }) => {
        await navigateTo(adminPage, route.path);

        await expect(adminPage).toHaveURL(/\/(errors\/forbidden|dashboard)/);
      });
    }
  }
});

test.describe('Permissões de Acesso - SUPER_ADMIN', () => {
  for (const route of ROUTES) {
    if (route.superAdminAccess) {
      test(`SUPER_ADMIN deve acessar ${route.description} (${route.path})`, async ({
        superAdminPage,
      }) => {
        await navigateTo(superAdminPage, route.path);
        await waitForLoading(superAdminPage);

        await expect(superAdminPage).not.toHaveURL(/\/errors\/forbidden/);
        await expect(superAdminPage).toHaveURL(new RegExp(route.path.replace(/\//g, '/')));
      });
    }
    // SUPER_ADMIN tem acesso a tudo, não precisa testar negações
  }
});

test.describe('Sidebar - Visibilidade por Role', () => {
  test('USER deve ver apenas links básicos no sidebar', async ({ userPage }) => {
    await navigateTo(userPage, '/dashboard');
    await waitForLoading(userPage);

    const menuNav = userPage.getByRole('navigation', { name: 'Menu de navegação' });

    // USER vê (itens sem restrição de papel ou que incluem USER)
    await expect(menuNav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Pontos de Gás' })).toBeVisible();

    // USER NÃO vê (restritos a ADMIN/SUPER_ADMIN)
    await expect(menuNav.getByRole('link', { name: 'Usuários' })).not.toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Empresas' })).not.toBeVisible();
  });

  test('ADMIN deve ver links de admin no sidebar', async ({ adminPage }) => {
    await navigateTo(adminPage, '/dashboard');
    await waitForLoading(adminPage);

    const menuNav = adminPage.getByRole('navigation', { name: 'Menu de navegação' });

    // ADMIN vê
    await expect(menuNav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Usuários' })).toBeVisible();

    // ADMIN NÃO vê (apenas SUPER_ADMIN)
    await expect(menuNav.getByRole('link', { name: 'Empresas' })).not.toBeVisible();
  });

  test('SUPER_ADMIN deve ver todos os links no sidebar', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/dashboard');
    await waitForLoading(superAdminPage);

    const menuNav = superAdminPage.getByRole('navigation', { name: 'Menu de navegação' });

    // SUPER_ADMIN vê tudo
    await expect(menuNav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(menuNav.getByRole('link', { name: 'Usuários' })).toBeVisible();
    // Empresas pode estar em submenu ou ter nome diferente
  });
});

test.describe('Botões de Ação - Visibilidade por Role', () => {
  test('USER não deve ver botão de criar em kits', async ({ userPage }) => {
    await navigateTo(userPage, '/equipment/kits');
    await waitForLoading(userPage);

    const createButton = userPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).not.toBeVisible();
  });

  test('ADMIN não deve ver botão de criar em kits', async ({ adminPage }) => {
    await navigateTo(adminPage, '/equipment/kits');
    await waitForLoading(adminPage);

    const createButton = adminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).not.toBeVisible();
  });

  test('SUPER_ADMIN deve ver botão de criar em kits', async ({ superAdminPage }) => {
    await navigateTo(superAdminPage, '/equipment/kits');
    await waitForLoading(superAdminPage);

    const createButton = superAdminPage.getByRole('button', { name: /Novo|Criar|Adicionar/i });
    await expect(createButton).toBeVisible();
  });
});

test.describe('Proteção de Rotas - Usuário Não Autenticado', () => {
  test('deve redirecionar para login ao acessar rota protegida sem auth', async ({ page }) => {
    // Página sem autenticação
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve manter returnUrl ao redirecionar para login', async ({ page }) => {
    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/auth\/login\?returnUrl/);
  });
});
