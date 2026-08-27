import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { extractApiErrorMessage } from '@shared/utils';
import { catchError, throwError } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { NotificationService } from '../../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const router = inject(Router);
  const configService = inject(ConfigService);

  const isApiRequest = req.url.startsWith(configService.apiUrl);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isApiRequest) {
        return throwError(() => error);
      }

      let errorMessage = 'Ocorreu um erro inesperado.';

      // Check if this is a known auth error that should be handled by components
      const errorCode = error.error?.errorCode as string | undefined;
      const authErrorCodes = [
        'UserNotConfirmedException',
        'NotAuthorizedException',
        'UserNotFoundException',
      ];
      if (errorCode && authErrorCodes.includes(errorCode)) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 0:
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
        case 400:
          errorMessage = extractApiErrorMessage(error) ?? 'Requisição inválida.';
          break;
        case 401:
          // Handled by JWT interceptor
          return throwError(() => error);
        case 403:
          errorMessage = 'Você não tem permissão para realizar esta ação.';
          void router.navigate(['/errors/forbidden']);
          break;
        case 404:
          errorMessage = extractApiErrorMessage(error) ?? 'Recurso não encontrado.';
          break;
        case 422:
          errorMessage = extractApiErrorMessage(error) ?? 'Erro de validação.';
          break;
        case 500:
          errorMessage =
            extractApiErrorMessage(error) ?? 'Erro no servidor. Tente novamente mais tarde.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = extractApiErrorMessage(error) ?? errorMessage;
      }

      notificationService.error(errorMessage);
      return throwError(() => error);
    }),
  );
};
