import { expect, test } from '@playwright/test';
import { mockAuth } from '../utils/auth';

test.describe('Dashboard - rota protegida (sem autenticação)', () => {
  test('deve redirecionar para login e exibir a tela de autenticação', async ({ page }) => {
    await page.goto('/dashboard');

    // Redireciona para a página de login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Garante que estamos na tela de login
    await expect(page.getByRole('heading', { name: 'Inteligás', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta', level: 2 })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });
});

test.describe('Dashboard - autenticado', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, {
      user: {
        firstName: 'Marce',
        lastName: 'Teste',
        roles: ['USER'],
        email: 'marce.teste@gastrack.local',
      },
    });
  });

  test('deve exibir boas-vindas e métricas principais', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Bem-vindo, Marce/i })).toBeVisible();
    await expect(page.getByText('Aqui está o resumo das operações.')).toBeVisible();

    const metricsList = page.getByRole('list', { name: 'Métricas principais' });
    await expect(metricsList).toBeVisible();
    await expect(metricsList.getByText('Empresas Ativas')).toBeVisible();
    await expect(metricsList.getByText('Contratos Ativos')).toBeVisible();
    await expect(metricsList.getByText('Kits Ativos')).toBeVisible();
    await expect(metricsList.getByText('Equipamentos')).toBeVisible();
  });
});
