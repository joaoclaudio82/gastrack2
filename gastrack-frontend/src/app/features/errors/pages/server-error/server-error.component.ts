import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Code -->
        <div class="mb-8">
          <span
            class="text-9xl font-bold text-[var(--color-warning)]"
            style="text-shadow: 0 4px 12px var(--color-warning-bg);"
          >
            500
          </span>
        </div>

        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div
            class="flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
          >
            <svg
              class="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <!-- Title & Message -->
        <h1 class="text-3xl font-bold text-foreground mb-4">Erro no Servidor</h1>
        <p class="text-muted-foreground mb-8">
          Algo deu errado do nosso lado. Por favor, tente novamente mais tarde ou entre em contato
          com o suporte se o problema persistir.
        </p>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <app-button variant="primary" (buttonClick)="reload()">Tentar Novamente</app-button>
          <a routerLink="/dashboard">
            <app-button variant="outline">Ir para Dashboard</app-button>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ServerErrorComponent {
  protected reload(): void {
    window.location.reload();
  }
}
