import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type {
  ChallengeContext,
  ConfirmRequest,
  ConfirmResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RespondChallengeRequest,
  User,
} from '@models/auth.model';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { TokenService } from './token.service';

/**
 * Primeiro valor não-vazio. O Cognito real não preenche `given_name`/`family_name`, então o nome
 * extraído do ID token chega como string vazia — `??` não cobre esse caso, só `null`/`undefined`.
 */
function firstNonBlank(...values: (string | null | undefined)[]): string {
  return values.find((value) => value != null && value.trim().length > 0)?.trim() ?? '';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly configService = inject(ConfigService);

  // Signal-based state management
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly challengeContextSignal = signal<ChallengeContext | null>(null);

  // Computed values
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly challengeContext = this.challengeContextSignal.asReadonly();
  readonly userRoles = computed(() => this.currentUserSignal()?.roles ?? []);
  readonly userFullName = computed(() => {
    const user = this.currentUserSignal();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  /**
   * Nome para exibir, com fallback que funciona de verdade.
   *
   * `firstName ?? 'Usuário'` não cobre o caso real: o Cognito não preenche `given_name`, então o
   * nome chega como **string vazia**, e `??` só dispara em null/undefined. O avatar renderizava
   * um círculo vazio e o perfil um campo em branco — nunca o fallback.
   */
  readonly displayName = computed(() => {
    const user = this.currentUserSignal();
    return firstNonBlank(user?.firstName, user?.lastName, user?.email) || 'Usuário';
  });

  readonly userInitial = computed(() => this.displayName().charAt(0).toUpperCase());
  readonly currentCompany = computed(() => this.currentUserSignal()?.company ?? null);
  readonly currentCompanyId = computed(() => this.currentUserSignal()?.companyId ?? null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.challengeContextSignal.set(null);

    return this.http
      .post<LoginResponse>(`${this.configService.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          // Check if authentication requires a challenge (e.g., NEW_PASSWORD_REQUIRED)
          if (response.challengeName && response.session) {
            this.challengeContextSignal.set({
              username: credentials.username,
              session: response.session,
              challengeName: response.challengeName,
            });
            this.isLoadingSignal.set(false);
            return;
          }

          // Normal login flow - tokens received
          if (response.accessToken && response.idToken && response.refreshToken) {
            this.tokenService.setTokens(
              response.accessToken,
              response.refreshToken,
              response.idToken,
            );
            const user = this.extractUserFromToken(response.idToken);
            if (user) {
              user.firstName = response.firstName ?? user.firstName;
              user.lastName = response.lastName ?? user.lastName;
            }
            this.currentUserSignal.set(user);
          }
          this.isLoadingSignal.set(false);
        }),
        // A empresa precisa chegar antes da navegação: a tela seguinte já lê currentCompanyId().
        switchMap((response) =>
          this.currentUserSignal() ? this.loadProfile().pipe(map(() => response)) : of(response),
        ),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSignal.set(errorMessage);
          return throwError(() => error);
        }),
      );
  }

  respondToChallenge(request: RespondChallengeRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<LoginResponse>(`${this.configService.apiUrl}/auth/respond-challenge`, request)
      .pipe(
        tap((response) => {
          if (response.accessToken && response.idToken && response.refreshToken) {
            this.tokenService.setTokens(
              response.accessToken,
              response.refreshToken,
              response.idToken,
            );
            const user = this.extractUserFromToken(response.idToken);
            if (user) {
              user.firstName = response.firstName ?? user.firstName;
              user.lastName = response.lastName ?? user.lastName;
            }
            this.currentUserSignal.set(user);
            this.challengeContextSignal.set(null);
          }
          this.isLoadingSignal.set(false);
        }),
        switchMap((response) =>
          this.currentUserSignal() ? this.loadProfile().pipe(map(() => response)) : of(response),
        ),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSignal.set(errorMessage);
          return throwError(() => error);
        }),
      );
  }

  clearChallenge(): void {
    this.challengeContextSignal.set(null);
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<RegisterResponse>(`${this.configService.apiUrl}/auth/signup`, data).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error: unknown) => {
        this.isLoadingSignal.set(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => error);
      }),
    );
  }

  confirmAccount(data: ConfirmRequest): Observable<ConfirmResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<ConfirmResponse>(`${this.configService.apiUrl}/auth/confirm`, data).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error: unknown) => {
        this.isLoadingSignal.set(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => error);
      }),
    );
  }

  resendConfirmationCode(username: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.configService.apiUrl}/auth/resend-code?username=${encodeURIComponent(username)}`,
      {},
    );
  }

  forgotPassword(username: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.configService.apiUrl}/auth/forgot-password?username=${encodeURIComponent(username)}`,
      {},
    );
  }

  resetPassword(
    username: string,
    code: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.configService.apiUrl}/auth/reset-password`, {
      username,
      confirmationCode: code,
      newPassword,
    });
  }

  /**
   * Completa o usuário logado com empresa e nome vindos do banco (GET /users/me).
   *
   * O ID token não carrega a empresa: nenhum fluxo grava `custom:company_id` no Cognito. Sem
   * isto, tudo que depende de `currentCompanyId()` fica nulo em silêncio — foi assim que o
   * "Novo Ponto de Gás" do ADMIN abriu com o select de contrato vazio.
   *
   * Falha de rede não derruba o login: o app segue sem empresa, como já seguia.
   */
  loadProfile(): Observable<User | null> {
    return this.http
      .get<{
        companyId?: number | null;
        companyName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      }>(`${this.configService.apiUrl}/users/me`)
      .pipe(
        map((profile) => {
          const current = this.currentUserSignal();
          if (!current) return null;
          const companyId = profile.companyId ?? undefined;
          const companyName = profile.companyName ?? undefined;
          const user: User = {
            ...current,
            firstName: firstNonBlank(profile.firstName, current.firstName),
            lastName: firstNonBlank(profile.lastName, current.lastName),
            companyId,
            company: companyId && companyName ? { id: companyId, name: companyName } : undefined,
          };
          this.currentUserSignal.set(user);
          return user;
        }),
        catchError(() => of(null)),
      );
  }

  logout(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      this.http
        .post(
          `${this.configService.apiUrl}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .subscribe();
    }
    this.tokenService.clearTokens();
    this.currentUserSignal.set(null);
    this.errorSignal.set(null);
    void this.router.navigate(['/auth/login']);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  refreshSession(): Observable<LoginResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    const idToken = this.tokenService.getIdToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<LoginResponse>(`${this.configService.apiUrl}/auth/refresh`, { refreshToken, idToken })
      .pipe(
        tap((response) => {
          if (response.accessToken && response.refreshToken && response.idToken) {
            this.tokenService.setTokens(
              response.accessToken,
              response.refreshToken,
              response.idToken,
            );
            this.currentUserSignal.set(this.mergeWithCurrent(response.idToken));
          }
        }),
      );
  }

  /**
   * Reconstrói o usuário a partir do token novo **sem perder** o que só o banco tem.
   *
   * O refresh troca token, não identidade. Substituir o signal pelo que o ID token carrega
   * apagava empresa e nome vindos do /users/me — e quem chama isto é o jwt.interceptor, em todo
   * 401 no meio da sessão. Resultado: `currentCompanyId()` voltava a nulo no primeiro token
   * expirado em uso, reabrindo o buraco que o loadProfile fechou.
   *
   * Aqui não dá para chamar o /users/me: esta chamada roda dentro do tratamento de 401, e um
   * request novo nesse ponto espera o refresh que ainda não terminou.
   */
  private mergeWithCurrent(idToken: string): User | null {
    const fromToken = this.extractUserFromToken(idToken);
    const current = this.currentUserSignal();
    if (!fromToken || !current) return fromToken;

    return {
      ...fromToken,
      firstName: firstNonBlank(fromToken.firstName, current.firstName),
      lastName: firstNonBlank(fromToken.lastName, current.lastName),
      companyId: fromToken.companyId ?? current.companyId,
      company: fromToken.company ?? current.company,
    };
  }

  /**
   * Restaura a sessão no bootstrap (inclusive num F5) e só termina com a empresa em mãos.
   *
   * Quem chama espera o Observable: renderizar antes do /users/me devolve `currentCompanyId()`
   * nulo para a primeira tela — o mesmo buraco em que o form de ponto de gás caiu.
   */
  initializeAuth(): Observable<unknown> {
    const idToken = this.tokenService.getIdToken();
    const accessToken = this.tokenService.getAccessToken();

    if (idToken && accessToken && !this.tokenService.isTokenExpired(accessToken)) {
      const user = this.extractUserFromToken(idToken);
      this.currentUserSignal.set(user);
      return this.loadProfile();
    }

    if (this.tokenService.getRefreshToken()) {
      // Token vencido: o refresh também precisa terminar no /users/me, senão a sessão volta
      // sem empresa — o caso é justamente o F5 depois de uma hora parado.
      return this.refreshSession().pipe(
        switchMap(() => this.loadProfile()),
        catchError(() => {
          this.logout();
          return of(null);
        }),
      );
    }

    return of(null);
  }

  updateUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private extractUserFromToken(idToken: string): User | null {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2 || !parts[1]) return null;
      const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;

      // Claims de empresa só existem em token fabricado (e2e). No Cognito real nenhum fluxo
      // grava custom:company_id — quem responde a empresa é loadProfile(), do banco.
      const rawCompanyId = Number(payload['custom:company_id']);
      const companyId =
        Number.isFinite(rawCompanyId) && rawCompanyId > 0 ? rawCompanyId : undefined;
      const companyName = payload['custom:company_name'] as string | undefined;

      return {
        id: payload['sub'] as string,
        email: payload['email'] as string,
        firstName:
          (payload['given_name'] as string) ?? (payload['name'] as string)?.split(' ')[0] ?? '',
        lastName:
          (payload['family_name'] as string) ??
          (payload['name'] as string)?.split(' ').slice(1).join(' ') ??
          '',
        roles: (payload['cognito:groups'] as string[]) ?? ['USER'],
        companyId,
        company: companyId && companyName ? { id: companyId, name: companyName } : undefined,
        createdAt: new Date((payload['auth_time'] as number) * 1000),
      };
    } catch {
      return null;
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) {
        return err.error.message;
      }
    }
    return 'An unexpected error occurred';
  }
}
