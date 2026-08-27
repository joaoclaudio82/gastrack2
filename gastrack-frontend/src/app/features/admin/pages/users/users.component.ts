import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { PermissionService } from '@core/auth/services/permission.service';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { CompanyService } from '@core/services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService, type UserListItem } from '@core/services/user.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { ROLE_BADGE_COLORS, ROLE_LABELS, UserRole } from '@models/role.model';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '@shared/components/ui/action-menu/action-menu.component';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    DatePipe,
    ActionMenuComponent,
    BadgeComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-foreground">Usuários</h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
        @if (isSuperAdmin()) {
          <app-select
            placeholder="Filtrar por função"
            [options]="roleFilterOptions"
            (valueChange)="onRoleFilterChange($event)"
            class="w-full sm:w-48"
          />
          <app-select
            placeholder="Filtrar por empresa"
            [options]="companyFilterOptions()"
            (valueChange)="onCompanyFilterChange($event)"
            class="w-full sm:w-56"
          />
        }
      </div>

      @if (userService.isLoading() && userService.users().length === 0) {
        <app-table-loading-state
          text="Carregando usuários"
          hint="Buscando colaboradores cadastrados."
        />
      } @else if (userService.users().length === 0) {
        <app-empty-state
          title="Nenhum usuário encontrado"
          description="Os usuários aparecerão aqui após serem convidados e confirmarem suas contas."
        />
      } @else {
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Email
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Nome
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Função
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Empresa
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Último Acesso
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Ações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (user of userService.users(); track user.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">{{ user.email }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0"
                    >
                      {{ getInitial(user) }}
                    </div>
                    <span class="text-sm font-medium text-foreground">
                      {{ getFullName(user) || '-' }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-2">
                    @for (role of getDisplayedRoles(user); track role) {
                      <app-badge
                        [variant]="getRoleBadgeVariant(role)"
                        [class]="getRoleBadgeClasses(role)"
                      >
                        {{ getRoleLabel(role) }}
                      </app-badge>
                    }
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ user.companyName || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (user.active) {
                    <app-badge variant="success">Ativo</app-badge>
                  } @else {
                    <app-badge variant="default">Inativo</app-badge>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ user.lastLoginAt ? (user.lastLoginAt | date: 'dd/MM/yyyy HH:mm') : '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex justify-start">
                    <app-action-menu [items]="rowActions(user)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="userService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>
  `,
})
export class UsersComponent implements OnInit {
  readonly userService = inject(UserService);
  private readonly companyService = inject(CompanyService);
  private readonly permissionService = inject(PermissionService);
  private readonly notificationService = inject(NotificationService);

  readonly isSuperAdmin = this.permissionService.isSuperAdmin;

  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly roleFilter = signal<string | null>(null);
  readonly companyFilter = signal<string | null>(null);

  readonly roleFilterOptions: SelectOption[] = [
    { label: 'Todas as funções', value: null },
    { label: 'Usuário', value: UserRole.USER },
    { label: 'Administrador', value: UserRole.ADMIN },
    { label: 'Super Admin', value: UserRole.SUPER_ADMIN },
  ];

  readonly companyFilterOptions = () => {
    const companies = this.companyService.activeCompanies();
    return [
      { label: 'Todas as empresas', value: null },
      ...companies.map((c) => ({ label: c.name, value: c.id })),
    ];
  };

  ngOnInit(): void {
    this.loadUsers();
    if (this.isSuperAdmin()) {
      this.companyService.getActive();
    }
  }

  loadUsers(): void {
    const params: { page: number; pageSize: number; role?: string; companyId?: string } = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
    };

    const role = this.roleFilter();
    const companyId = this.companyFilter();

    if (role) {
      params.role = role;
    }
    if (companyId) {
      params.companyId = companyId;
    }

    this.userService.getAll(params);
  }

  getInitial(user: UserListItem): string {
    return user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase();
  }

  getFullName(user: UserListItem): string {
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user.email;
  }

  getRoleLabel(role: string): string {
    return ROLE_LABELS[role as UserRole] ?? role;
  }

  getRoleBadgeVariant(role: string): 'default' | 'info' | 'primary' {
    if (role === 'SUPER_ADMIN') return 'primary';
    if (role === 'ADMIN') return 'info';
    return 'default';
  }

  getDisplayedRoles(user: UserListItem): string[] {
    if (user.roles && user.roles.length > 0) {
      return user.roles;
    }
    if (user.role) {
      return [user.role];
    }
    return [];
  }

  getRoleBadgeClasses(role: string): string {
    const colors = ROLE_BADGE_COLORS[role as UserRole];
    if (!colors) return '';
    return `${colors.bg} ${colors.text}`;
  }

  onRoleFilterChange(value: string | number | null): void {
    this.roleFilter.set(value as string | null);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onCompanyFilterChange(value: string | number | null): void {
    this.companyFilter.set(value as string | null);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadUsers();
  }

  rowActions(user: UserListItem): ActionMenuItem[] {
    return [
      user.active
        ? {
            label: 'Desativar',
            icon: 'toggle',
            action: () => {
              this.deactivateUser(user);
            },
          }
        : {
            label: 'Ativar',
            icon: 'toggle',
            action: () => {
              this.activateUser(user);
            },
          },
    ];
  }

  activateUser(user: UserListItem): void {
    this.userService.activate(user.id).subscribe({
      next: () => {
        this.notificationService.success('Usuário ativado com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao ativar usuário.');
      },
    });
  }

  deactivateUser(user: UserListItem): void {
    this.userService.deactivate(user.id).subscribe({
      next: () => {
        this.notificationService.success('Usuário desativado com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao desativar usuário.');
      },
    });
  }
}
