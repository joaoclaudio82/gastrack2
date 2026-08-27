import { Routes } from '@angular/router';

export const CYLINDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cylinders-list/cylinders-list.component').then(
        (m) => m.CylindersListComponent,
      ),
    data: { breadcrumb: 'Cilindros' },
  },
];
