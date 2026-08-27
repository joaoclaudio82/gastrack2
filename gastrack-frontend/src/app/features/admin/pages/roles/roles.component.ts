import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [ButtonComponent, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Funções</h1>
      </div>
      <app-button variant="primary">
        <svg
          class="w-4 h-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Adicionar Função
      </app-button>
    </div>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      @for (role of roles; track role.id) {
        <div
          class="bg-card rounded-sm shadow-sm border border-border p-6 hover:shadow-md hover:border-primary/50 transition-all group"
        >
          <!-- Role Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-foreground">{{ role.name }}</h3>
              <p class="text-sm mt-1 text-muted-foreground">
                <span class="inline-flex items-center gap-1">
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {{ role.usersCount }} usuários
                </span>
              </p>
            </div>
            <div
              class="flex items-center justify-center w-10 h-10 rounded-sm bg-primary/10 text-primary"
            >
              <svg
                class="w-5 h-5"
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

          <!-- Role Description -->
          <p class="text-sm mb-4 text-muted-foreground">{{ role.description }}</p>

          <!-- Permissions -->
          <div class="flex flex-wrap gap-2 mb-4">
            @for (permission of role.permissions.slice(0, 3); track permission) {
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {{ permission }}
              </span>
            }
            @if (role.permissions.length > 3) {
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
              >
                +{{ role.permissions.length - 3 }}
              </span>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-4 border-t border-border">
            <button
              type="button"
              class="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-sm transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class RolesComponent {
  protected readonly roles = [
    {
      id: 1,
      name: 'Admin',
      description: 'Full access to all features and settings',
      usersCount: 2,
      permissions: [
        'users.manage',
        'roles.manage',
        'settings.manage',
        'reports.view',
        'billing.manage',
      ],
    },
    {
      id: 2,
      name: 'Editor',
      description: 'Can create and edit content',
      usersCount: 5,
      permissions: ['content.create', 'content.edit', 'content.delete'],
    },
    {
      id: 3,
      name: 'Viewer',
      description: 'Read-only access to content',
      usersCount: 15,
      permissions: ['content.view', 'reports.view'],
    },
  ];
}
