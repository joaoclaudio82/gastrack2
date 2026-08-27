import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { InvitationService } from '@core/services/invitation.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { CreateInvitationRequest, Invitation } from '@models/invitation.model';
import { INVITATION_STATUS_BADGE, InvitationStatus } from '@models/invitation.model';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '@shared/components/ui/action-menu/action-menu.component';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';
import { InvitationFormComponent } from '../../components/invitation-form/invitation-form.component';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [
    DatePipe,
    ActionMenuComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    SelectComponent,
    InvitationFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-foreground">Convites</h1>
          <p class="text-sm text-muted-foreground mt-1">Gerencie convites para novos usuários</p>
        </div>
        <app-button
          variant="primary"
          class="w-full sm:w-auto sm:flex-shrink-0"
          (buttonClick)="openForm()"
        >
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
          Convidar Usuário
        </app-button>
      </div>

      <!-- Filters -->
      <div class="mb-4 w-full sm:w-auto">
        <app-select
          placeholder="Filtrar por status"
          [options]="statusFilterOptions"
          (valueChange)="onStatusFilterChange($event)"
          class="w-full sm:w-64"
        />
      </div>

      @if (invitationService.isLoading() && invitations().length === 0) {
        <app-table-loading-state
          text="Carregando convites"
          hint="Buscando convites ativos e pendentes."
        />
      } @else if (invitations().length === 0) {
        <app-empty-state
          title="Nenhum convite encontrado"
          description="Comece convidando novos usuários para a plataforma."
          action="Convidar Usuário"
          (actionClick)="openForm()"
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
                Criado em
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Ações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (invitation of invitations(); track invitation.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">{{ invitation.email }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ getFullName(invitation) || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-badge [variant]="invitation.role === 'ADMIN' ? 'info' : 'default'">
                    {{ invitation.role === 'ADMIN' ? 'Administrador' : 'Usuário' }}
                  </app-badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ invitation.companyName }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-badge [variant]="getStatusBadge(invitation.status).variant">
                    {{ getStatusBadge(invitation.status).label }}
                  </app-badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ invitation.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (invitation.status === InvitationStatus.PENDING) {
                    <div class="flex justify-start">
                      <app-action-menu [items]="rowActions(invitation)" />
                    </div>
                  } @else {
                    <span class="text-sm text-muted-foreground/70">-</span>
                  }
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="invitationService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-invitation-form
      [isOpen]="isFormOpen()"
      [isLoading]="invitationService.isLoading()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />
  `,
})
export class InvitationsComponent implements OnInit {
  readonly invitationService = inject(InvitationService);
  private readonly notificationService = inject(NotificationService);

  readonly InvitationStatus = InvitationStatus;

  readonly isFormOpen = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly statusFilter = signal<InvitationStatus | null>(null);

  readonly invitations = this.invitationService.invitations;

  readonly statusFilterOptions: SelectOption[] = [
    { label: 'Todos os status', value: '' },
    { label: 'Pendente', value: InvitationStatus.PENDING },
    { label: 'Aceito', value: InvitationStatus.ACCEPTED },
    { label: 'Expirado', value: InvitationStatus.EXPIRED },
    { label: 'Cancelado', value: InvitationStatus.CANCELLED },
  ];

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations(): void {
    this.invitationService.getAll(
      {
        page: this.currentPage(),
        pageSize: this.pageSize(),
      },
      {
        status: this.statusFilter(),
      },
    );
  }

  getFullName(invitation: Invitation): string {
    const parts = [invitation.firstName, invitation.lastName].filter(Boolean);
    return parts.join(' ');
  }

  getStatusBadge(status: InvitationStatus): {
    variant: 'warning' | 'success' | 'default' | 'destructive';
    label: string;
  } {
    return INVITATION_STATUS_BADGE[status];
  }

  onStatusFilterChange(value: string | number | null): void {
    // Treat empty string as null (show all)
    const filterValue = value === '' || value === null ? null : (value as InvitationStatus);
    this.statusFilter.set(filterValue);
    this.currentPage.set(1);
    this.loadInvitations();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadInvitations();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadInvitations();
  }

  openForm(): void {
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  onFormSubmit(data: CreateInvitationRequest): void {
    this.invitationService.create(data).subscribe({
      next: () => {
        this.notificationService.success('Convite enviado com sucesso!');
        this.closeForm();
        this.loadInvitations();
      },
      error: () => {
        this.notificationService.error('Erro ao enviar convite.');
      },
    });
  }

  rowActions(invitation: Invitation): ActionMenuItem[] {
    return [
      {
        label: 'Reenviar',
        icon: 'transfer',
        action: () => {
          this.resendInvitation(invitation);
        },
      },
      {
        label: 'Cancelar',
        icon: 'delete',
        variant: 'destructive',
        action: () => {
          this.cancelInvitation(invitation);
        },
      },
    ];
  }

  resendInvitation(invitation: Invitation): void {
    this.invitationService.resend(invitation.id).subscribe({
      next: () => {
        this.notificationService.success('Convite reenviado com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao reenviar convite.');
      },
    });
  }

  cancelInvitation(invitation: Invitation): void {
    this.invitationService.cancel(invitation.id).subscribe({
      next: () => {
        this.notificationService.success('Convite cancelado com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao cancelar convite.');
      },
    });
  }
}
