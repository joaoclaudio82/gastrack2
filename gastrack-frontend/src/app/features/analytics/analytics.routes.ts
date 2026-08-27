import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/analytics-navigator/analytics-navigator.component').then(
        (m) => m.AnalyticsNavigatorComponent,
      ),
    data: { breadcrumb: 'Analytics de Pressão' },
  },
  {
    path: 'pressure/:deviceId',
    redirectTo: '',
    pathMatch: 'full',
  },
];
