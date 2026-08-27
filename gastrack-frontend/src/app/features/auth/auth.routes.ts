import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    data: { title: 'Login' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    data: { title: 'Reset Password' },
  },
  {
    path: 'confirm-account',
    loadComponent: () =>
      import('./pages/confirm-account/confirm-account.component').then(
        (m) => m.ConfirmAccountComponent,
      ),
    data: { title: 'Confirm Account' },
  },
  {
    path: 'new-password',
    loadComponent: () =>
      import('./pages/new-password/new-password.component').then((m) => m.NewPasswordComponent),
    data: { title: 'Nova Senha' },
  },
];
