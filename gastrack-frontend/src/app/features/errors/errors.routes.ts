import { Routes } from '@angular/router';

export const ERROR_ROUTES: Routes = [
  {
    path: 'not-found',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: { title: 'Page Not Found' },
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
    data: { title: 'Access Denied' },
  },
  {
    path: 'server-error',
    loadComponent: () =>
      import('./pages/server-error/server-error.component').then((m) => m.ServerErrorComponent),
    data: { title: 'Server Error' },
  },
];
