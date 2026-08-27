import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/guards/auth.guard';
import { guestGuard } from '@core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@layouts/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: 'admin',
        loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
        data: { breadcrumb: 'Admin' },
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('@features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
        data: { breadcrumb: 'Profile' },
      },
      {
        path: 'cylinders',
        loadChildren: () =>
          import('@features/cylinders/cylinders.routes').then((m) => m.CYLINDERS_ROUTES),
        data: { breadcrumb: 'Cilindros' },
      },
      {
        path: 'equipment',
        loadChildren: () =>
          import('@features/equipment/equipment.routes').then((m) => m.EQUIPMENT_ROUTES),
        data: { breadcrumb: 'Equipamentos' },
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('@features/analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
        data: { breadcrumb: 'Analytics' },
      },
    ],
  },
  {
    path: 'errors',
    loadChildren: () => import('@features/errors/errors.routes').then((m) => m.ERROR_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'errors/not-found',
  },
];
