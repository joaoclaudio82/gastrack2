import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

/**
 * Regressão: a empresa do usuário era lida do claim `custom:company_id`, que nenhum fluxo grava
 * no Cognito. `currentCompanyId()` ficava nulo em produção e o form de ponto de gás abria com o
 * select de contrato vazio, sem erro visível. A empresa vem do banco, via GET /users/me.
 */
describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const baseUrl = 'http://test/api/v1';

  function jwt(payload: Record<string, unknown>): string {
    return `header.${btoa(JSON.stringify(payload))}.signature`;
  }

  const idToken = jwt({
    sub: 'user-sub',
    email: 'admin@empresa.com',
    given_name: 'Marcelo',
    family_name: 'Antonio',
    'cognito:groups': ['ADMIN'],
    auth_time: 1_760_000_000,
  });

  /** Access token vencido = o F5 depois de uma hora parado: a sessão volta pelo refresh. */
  let tokenExpired = false;
  /** Alguns casos precisam de um ID token diferente do padrão (ex.: sem given_name). */
  let tokenOverride: string | null = null;

  beforeEach(() => {
    tokenExpired = false;
    tokenOverride = null;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ConfigService, useValue: { apiUrl: baseUrl } },
        {
          provide: TokenService,
          useValue: {
            getIdToken: () => tokenOverride ?? idToken,
            getAccessToken: () => 'access',
            getRefreshToken: () => 'refresh',
            isTokenExpired: () => tokenExpired,
            setTokens: () => void 0,
            clearTokens: () => void 0,
          },
        },
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('token sem claim de empresa deixa currentCompanyId nulo', () => {
    service.initializeAuth().subscribe();
    http.expectOne(`${baseUrl}/users/me`).flush({ id: 7, companyId: null, companyName: null });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentCompanyId()).toBeNull();
  });

  it('initializeAuth() busca a empresa no bootstrap (F5)', () => {
    service.initializeAuth().subscribe();

    http.expectOne(`${baseUrl}/users/me`).flush({ id: 7, companyId: 42, companyName: 'Empresa' });

    expect(service.currentCompanyId()).toBe(42);
  });

  it('sessão restaurada por refresh também termina com empresa', () => {
    tokenExpired = true;
    service.initializeAuth().subscribe();

    http.expectOne(`${baseUrl}/auth/refresh`).flush({
      accessToken: 'novo-access',
      refreshToken: 'novo-refresh',
      idToken,
    });
    http.expectOne(`${baseUrl}/users/me`).flush({ id: 7, companyId: 42, companyName: 'Empresa' });

    expect(service.currentCompanyId()).toBe(42);
  });

  /**
   * Regressão: o refresh do meio da sessão (jwt.interceptor, em todo 401) reconstruía o usuário
   * só a partir do ID token e substituía o signal — jogando fora tudo que o /users/me tinha
   * trazido. No primeiro 401, `currentCompanyId()` voltava a nulo e o nome sumia, que é
   * exatamente o buraco que o loadProfile fechou. O refresh troca token, não identidade.
   */
  it('refresh no meio da sessão preserva empresa e nome já carregados', () => {
    service.initializeAuth().subscribe();
    http.expectOne(`${baseUrl}/users/me`).flush({
      id: 7,
      firstName: 'Marcelo',
      lastName: 'Antonio',
      companyId: 42,
      companyName: 'Empresa',
    });

    service.refreshSession().subscribe();
    http.expectOne(`${baseUrl}/auth/refresh`).flush({
      accessToken: 'novo-access',
      refreshToken: 'novo-refresh',
      idToken,
    });

    expect(service.currentCompanyId()).toBe(42);
    expect(service.currentCompany()).toEqual({ id: 42, name: 'Empresa' });
    expect(service.currentUser()?.firstName).toBe('Marcelo');
  });

  /** `??` não cobre string vazia — e é assim que o nome chega quando o Cognito não o preenche. */
  it('nome vazio cai no fallback de exibição em vez de renderizar em branco', () => {
    // Token do Cognito real: sem given_name/family_name, o nome sai como string vazia.
    tokenOverride = jwt({
      sub: 'user-sub',
      email: 'admin@empresa.com',
      'cognito:groups': ['ADMIN'],
      auth_time: 1_760_000_000,
    });
    service.initializeAuth().subscribe();
    http.expectOne(`${baseUrl}/users/me`).flush({ id: 7, companyId: null, companyName: null });

    expect(service.currentUser()?.firstName).toBe('');
    expect(service.displayName()).toBe('admin@empresa.com');
    expect(service.userInitial()).toBe('A');
    expect(service.userFullName()).toBe('');
  });

  it('loadProfile() preenche a empresa a partir de GET /users/me', () => {
    service.initializeAuth().subscribe();
    http.expectOne(`${baseUrl}/users/me`).flush({ id: 7, companyId: null, companyName: null });
    service.loadProfile().subscribe();

    const req = http.expectOne(`${baseUrl}/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7, companyId: 42, companyName: 'Empresa Teste Marcelo' });

    expect(service.currentCompanyId()).toBe(42);
    expect(service.currentCompany()).toEqual({ id: 42, name: 'Empresa Teste Marcelo' });
  });

  it('SUPER_ADMIN sem empresa não inventa vínculo', () => {
    service.initializeAuth();
    service.loadProfile().subscribe();

    http.expectOne(`${baseUrl}/users/me`).flush({ id: 1, companyId: null, companyName: null });

    expect(service.currentCompanyId()).toBeNull();
    expect(service.currentCompany()).toBeNull();
  });

  it('falha no /users/me não desloga nem estoura', () => {
    service.initializeAuth();
    let emitted: unknown = 'nao-emitiu';
    service.loadProfile().subscribe((value) => {
      emitted = value;
    });

    http
      .expectOne(`${baseUrl}/users/me`)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(emitted).toBeNull();
    expect(service.isAuthenticated()).toBe(true);
  });
});
