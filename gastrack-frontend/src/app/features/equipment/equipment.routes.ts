import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/guards/role.guard';
import { UserRole } from '@models/role.model';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'contracts',
        pathMatch: 'full',
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./pages/contracts/contracts.component').then((m) => m.ContractsComponent),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Contratos',
          roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'kits',
        loadComponent: () => import('./pages/kits/kits.component').then((m) => m.KitsComponent),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Kits',
          roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'kits/:id',
        loadComponent: () =>
          import('./pages/kit-detail/kit-detail.component').then((m) => m.KitDetailComponent),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Detalhe do Kit',
          roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/equipment-list/equipment-list.component').then(
            (m) => m.EquipmentListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Inventário',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'device-logs',
        loadComponent: () =>
          import('./pages/device-ping-logs/device-ping-logs.component').then(
            (m) => m.DevicePingLogsComponent,
          ),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Logs de Ping',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/movement-history/movement-history.component').then(
            (m) => m.MovementHistoryComponent,
          ),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Histórico',
          roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      },
    ],
  },
];
