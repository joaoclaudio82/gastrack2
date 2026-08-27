import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Code -->
        <div class="mb-8">
          <span
            class="text-9xl font-bold text-destructive"
            style="text-shadow: 0 4px 12px var(--color-danger-bg);"
          >
            403
          </span>
        </div>

        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div
            class="flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 text-destructive"
          >
            <svg
              class="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <!-- Title & Message -->
        <h1 class="text-3xl font-bold text-foreground mb-4">Acesso Negado</h1>
        @if (reason) {
          <p class="text-muted-foreground mb-8">{{ reason }}</p>
        } @else {
          <p class="text-muted-foreground mb-8">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador se
            acredita que isso é um erro.
          </p>
        }

        <!-- Actions -->
        <div class="flex justify-center">
          <a routerLink="/dashboard">
            <app-button variant="primary">Ir para Dashboard</app-button>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ForbiddenComponent {
  /** Explicação específica quando o guard sabe dizer por que a porta está fechada. */
  protected readonly reason =
    (history.state as { forbiddenReason?: string } | null)?.forbiddenReason ?? null;
}
