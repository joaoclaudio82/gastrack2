import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const configService = inject(ConfigService);

  const isApiRequest = req.url.startsWith(configService.apiUrl);

  if (!isApiRequest) {
    return next(req);
  }

  // Skip auth endpoints
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/register')
  ) {
    return next(req);
  }

  // Usar ID Token ao invés de Access Token - contém as claims de identidade (email, etc)
  const token = tokenService.getIdToken();

  if (token) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(req, next, tokenService, authService);
      }
      return throwError(() => error);
    }),
  );
};

function addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  _tokenService: TokenService,
  authService: AuthService,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshSession().pipe(
      switchMap((response) => {
        isRefreshing = false;
        // Usar ID Token após refresh também
        if (response.idToken) {
          refreshTokenSubject.next(response.idToken);
          return next(addTokenToRequest(request, response.idToken));
        }
        return throwError(() => new Error('No ID token in refresh response'));
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      }),
    );
  }

  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) => next(addTokenToRequest(request, token))),
  );
}
