import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Code -->
        <div class="mb-8">
          <span
            class="text-9xl font-bold text-primary"
            style="text-shadow: 0 4px 12px hsl(var(--primary) / 0.2);"
          >
            404
          </span>
        </div>

        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div
            class="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary"
          >
            <svg
              class="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        <!-- Title & Message -->
        <h1 class="text-3xl font-bold text-foreground mb-4">Página Não Encontrada</h1>
        <p class="text-muted-foreground mb-8">
          Desculpe, não conseguimos encontrar a página que você está procurando. Verifique a URL ou
          navegue de volta ao dashboard.
        </p>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/dashboard">
            <app-button variant="primary" [fullWidth]="true">Ir para Dashboard</app-button>
          </a>
          <a routerLink="/auth/login">
            <app-button variant="outline" [fullWidth]="true">Voltar ao Login</app-button>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  // Static error page - no logic needed
}
