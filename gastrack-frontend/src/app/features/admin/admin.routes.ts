import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/guards/role.guard';
import { UserRole } from '@models/role.model';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./pages/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Onboarding', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Usuários', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'invitations',
        loadComponent: () =>
          import('./pages/invitations/invitations.component').then((m) => m.InvitationsComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Convites', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./pages/addresses/addresses.component').then((m) => m.AddressesComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Endereços', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'gas-points',
        loadComponent: () =>
          import('./pages/ponto-gas/ponto-gas.component').then((m) => m.PontoGasComponent),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Pontos de Gás',
          roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'cylinders',
        loadComponent: () =>
          import('./pages/cylinders/cylinders.component').then((m) => m.CylindersComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Cilindros', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./pages/companies/companies.component').then((m) => m.CompaniesComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Empresas', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'cylinder-models',
        loadComponent: () =>
          import('./pages/cylinder-models/cylinder-models.component').then(
            (m) => m.CylinderModelsComponent,
          ),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Catálogo de Cilindros',
          roles: [UserRole.SUPER_ADMIN],
          // O catálogo não tem dono: é uma tabela só para todas as empresas, e o volume
          // de cada linha é derivado dele. Editar um modelo mexeria nos números de outros
          // clientes — por isso a escrita fica com o administrador da plataforma.
          forbiddenReason:
            'O catálogo de modelos é compartilhado por todas as empresas, por isso só o administrador da plataforma pode mantê-lo. Você continua escolhendo modelos ao cadastrar cilindros e registrar trocas de botijão.',
        },
      },
      {
        path: 'gas-prices',
        loadComponent: () =>
          import('./pages/gas-prices/gas-prices.component').then((m) => m.GasPricesComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Preços de Gás', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'roles',
        loadComponent: () => import('./pages/roles/roles.component').then((m) => m.RolesComponent),
        canActivate: [roleGuard],
        data: { breadcrumb: 'Funções', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      },
    ],
  },
];
