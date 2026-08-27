import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [RouterLink, DatePipe, ButtonComponent, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-foreground">Perfil</h1>
      <a routerLink="edit">
        <app-button variant="outline">Editar Perfil</app-button>
      </a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="lg:col-span-1">
        <div class="bg-card rounded-sm shadow-sm border border-border p-6">
          <div class="flex flex-col items-center text-center">
            <div
              class="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-bold mb-4"
            >
              {{ authService.userInitial() }}
            </div>
            <h2 class="text-xl font-semibold text-foreground">
              {{ authService.displayName() }}
            </h2>
            <p class="text-sm text-muted-foreground mt-1">
              {{ authService.currentUser()?.email ?? 'usuario@exemplo.com' }}
            </p>
            <div class="flex flex-wrap gap-2 mt-4 justify-center">
              @for (role of authService.userRoles(); track role) {
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {{ role }}
                </span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information -->
      <div class="lg:col-span-2">
        <div class="bg-card rounded-sm shadow-sm border border-border p-6">
          <h2 class="text-lg font-semibold text-foreground mb-6">Informações da Conta</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Nome
              </p>
              <p class="text-sm text-foreground font-medium">
                {{ authService.currentUser()?.firstName || '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Sobrenome
              </p>
              <p class="text-sm text-foreground font-medium">
                {{ authService.currentUser()?.lastName ?? '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Email
              </p>
              <p class="text-sm text-foreground font-medium">
                {{ authService.currentUser()?.email ?? '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Membro Desde
              </p>
              <p class="text-sm text-foreground font-medium">
                {{ (authService.currentUser()?.createdAt | date: 'mediumDate') ?? '-' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileViewComponent {
  protected readonly authService = inject(AuthService);
}
