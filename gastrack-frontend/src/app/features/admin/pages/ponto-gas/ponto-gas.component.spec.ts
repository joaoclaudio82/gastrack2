import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/services/auth.service';
import type { PontoGas } from '@models/ponto-gas.model';
import { UserRole } from '@models/role.model';
import { PontoGasComponent } from './ponto-gas.component';

/**
 * O menu de ações sumia inteiro para quem não é ADMIN, e com ele ia embora o
 * único caminho para abrir os cilindros e equipamentos da linha — que é leitura,
 * e é justamente o que o USER precisa ver. Os botões de escrita continuam
 * escondidos dentro do painel, por canManage.
 */
describe('PontoGasComponent · ações por papel', () => {
  const ponto = { id: 1, location: 'Forno', active: true } as PontoGas;

  function montar(papeis: UserRole[]): PontoGasComponent {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AuthService,
          useValue: { hasAnyRole: (r: UserRole[]) => r.some((p) => papeis.includes(p)) },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new PontoGasComponent());
  }

  it('should_OnlyOfferDetails_When_UserCannotManage', () => {
    const acoes = montar([UserRole.USER]).rowActions(ponto);

    expect(acoes.map((a) => a.label)).toEqual(['Equipamentos']);
  });

  it('should_OfferManagementActions_When_UserIsAdmin', () => {
    const acoes = montar([UserRole.ADMIN]).rowActions(ponto);

    expect(acoes.map((a) => a.label)).toContain('Equipamentos');
    expect(acoes.map((a) => a.label)).toContain('Editar');
    expect(acoes.map((a) => a.label)).toContain('Excluir');
  });
});
