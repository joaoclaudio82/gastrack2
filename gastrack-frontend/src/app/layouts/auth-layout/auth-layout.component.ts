import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Modern GasTrack Auth Layout - Compact to fit viewport -->
    <main class="flex h-screen items-center justify-center bg-primary p-4">
      <div class="w-full max-w-sm space-y-4">
        <!-- GasTrack Logo Section - Compact -->
        <div class="text-center">
          <div class="mb-2 flex items-center justify-center">
            <!-- Gas Cylinder Icon -->
            <svg
              class="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="8" y="2" width="8" height="20" rx="2" />
              <path d="M8 6h8M8 10h8M8 14h8M8 18h8" />
              <circle cx="12" cy="4" r="1" fill="currentColor" />
            </svg>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-primary-foreground">
            Inteligás
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-primary-foreground font-medium">
            Sistema de Gerenciamento de Gás
          </p>
        </div>

        <!-- Auth Content Card - Compact -->
        <div
          class="rounded-md bg-card p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all duration-200"
        >
          <router-outlet />
        </div>

        <!-- Footer - Compact -->
        <div class="text-center">
          <p class="text-xs text-primary-foreground/90">
            &copy; {{ currentYear }} Inteligás. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </main>
  `,
  styles: ``,
})
export class AuthLayoutComponent {
  protected readonly currentYear = new Date().getFullYear();
}
