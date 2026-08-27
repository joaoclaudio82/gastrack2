import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading,
  withRouterConfig,
} from '@angular/router';

import { AuthService } from '@core/auth/services/auth.service';
import { provideCoreServices } from '@core/providers/core.providers';
import { UserPreferencesService } from '@core/services/user-preferences.service';
import { tap } from 'rxjs';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Migrar para animate.enter/leave em v23
    provideAnimations(),
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withPreloading(PreloadAllModules),
    ),
    provideCoreServices(),
    // A empresa não está no token: só existe depois do /users/me. Esperar a restauração da
    // sessão aqui mantém currentCompanyId() síncrono para o resto do app, inclusive num F5.
    // As preferências vêm depois, encadeadas: antes disso `isAuthenticated()` ainda pode ser
    // falso quando a sessão veio de refresh.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const prefs = inject(UserPreferencesService);
      return auth.initializeAuth().pipe(
        tap(() => {
          if (auth.isAuthenticated()) {
            prefs.load().subscribe({ error: () => void 0 });
          }
        }),
      );
    }),
  ],
};
