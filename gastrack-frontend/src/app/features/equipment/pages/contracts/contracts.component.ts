import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { BadgeVariant } from '@models/badge.types';
import type { Contract, ContractRequest, ContractStatus } from '@models/contract.model';
import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VARIANTS,
} from '@models/contract.model';
import { UserRole } from '@models/role.model';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '@shared/components/ui/action-menu/action-menu.component';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';
import { ContractFormComponent } from '../../components/contract-form/contract-form.component';

@Component({
  selector: 'app-contracts',
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
    ContractFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-foreground">Contratos</h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie os contratos de equipamentos
          </p>
        </div>
        @if (isSuperAdmin()) {
          <app-button
            variant="primary"
            (buttonClick)="openForm()"
            class="w-full sm:w-auto sm:flex-shrink-0"
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
            Novo Contrato
          </app-button>
        }
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2">
        <app-button
          [variant]="statusFilter() === null ? 'primary' : 'outline'"
          size="sm"
          (buttonClick)="setStatusFilter(null)"
          class="flex-1 sm:flex-none min-w-[80px]"
        >
          Todos
        </app-button>
        @for (status of statusOptions; track status.value) {
          <app-button
            [variant]="statusFilter() === status.value ? 'primary' : 'outline'"
            size="sm"
            (buttonClick)="setStatusFilter(status.value)"
            class="flex-1 sm:flex-none min-w-[100px]"
          >
            {{ status.label }}
          </app-button>
        }
      </div>

      @if (contractService.isLoading() && contractService.contracts().length === 0) {
        <app-table-loading-state
          text="Carregando contratos"
          hint="Buscando os contratos disponíveis."
        />
      } @else if (contractService.contracts().length === 0) {
        <app-empty-state
          title="Nenhum contrato encontrado"
          description="Não há contratos cadastrados no sistema."
          [action]="isSuperAdmin() ? 'Cadastrar Contrato' : ''"
          (actionClick)="openForm()"
        />
      } @else {
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Número
              </th>
              @if (isSuperAdmin()) {
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Empresa
                </th>
              }
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Data Início
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Data Fim
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Kits
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Ações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (contract of contractService.contracts(); track contract.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">
                    {{ contract.contractNumber }}
                  </span>
                </td>
                @if (isSuperAdmin()) {
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-muted-foreground">{{ contract.companyName }}</span>
                  </td>
                }
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ contract.startDate | date: 'dd/MM/yyyy' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ contract.endDate ? (contract.endDate | date: 'dd/MM/yyyy') : '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ contract.activeKitsCount }} / {{ contract.kitQuantity }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-badge [variant]="getStatusVariant(contract.status)">
                    {{ getStatusLabel(contract.status) }}
                  </app-badge>
                </td>
                <td class="px-3 sm:px-6 py-4">
                  <div class="flex justify-start">
                    <app-action-menu [items]="rowActions(contract)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="contractService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-contract-form
      [isOpen]="isFormOpen()"
      [contract]="selectedContract()"
      [isLoading]="contractService.isLoading()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />
  `,
})
export class ContractsComponent implements OnInit {
  readonly contractService = inject(ContractService);
  private readonly authService = inject(AuthService);
  private readonly companyService = inject(CompanyService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isFormOpen = signal(false);
  readonly selectedContract = signal<Contract | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly statusFilter = signal<ContractStatus | null>(null);

  readonly statusOptions = [
    { label: 'Ativo', value: CONTRACT_STATUS.ACTIVE as ContractStatus },
    { label: 'Rascunho', value: CONTRACT_STATUS.DRAFT as ContractStatus },
    { label: 'Suspenso', value: CONTRACT_STATUS.SUSPENDED as ContractStatus },
    { label: 'Expirado', value: CONTRACT_STATUS.EXPIRED as ContractStatus },
    { label: 'Cancelado', value: CONTRACT_STATUS.CANCELLED as ContractStatus },
  ];

  ngOnInit(): void {
    this.loadContracts();
    if (this.isSuperAdmin()) {
      this.companyService.getActive();
    }
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  loadContracts(): void {
    const params = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
    };
    this.contractService.getAll(params, {
      status: this.statusFilter(),
    });
  }

  setStatusFilter(status: ContractStatus | null): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadContracts();
  }

  getStatusLabel(status: string): string {
    return CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] ?? status;
  }

  getStatusVariant(status: string): BadgeVariant {
    return CONTRACT_STATUS_VARIANTS[status as keyof typeof CONTRACT_STATUS_VARIANTS] ?? 'default';
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadContracts();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadContracts();
  }

  openForm(): void {
    this.selectedContract.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedContract.set(null);
  }

  rowActions(contract: Contract): ActionMenuItem[] {
    const items: ActionMenuItem[] = [];

    if (this.isSuperAdmin()) {
      items.push({
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.editContract(contract);
        },
      });

      if (contract.status === 'DRAFT') {
        items.push({
          label: 'Ativar',
          icon: 'toggle',
          action: () => {
            this.activateContract(contract);
          },
        });
      }

      if (contract.status === 'ACTIVE') {
        items.push({
          label: 'Suspender',
          icon: 'toggle',
          action: () => {
            this.suspendContract(contract);
          },
        });
      }

      if (contract.status === 'SUSPENDED') {
        items.push({
          label: 'Reativar',
          icon: 'toggle',
          action: () => {
            this.activateContract(contract);
          },
        });
      }
    }

    items.push({
      label: 'Ver Kits',
      icon: 'view',
      action: () => {
        this.viewKits(contract);
      },
    });

    return items;
  }

  editContract(contract: Contract): void {
    this.selectedContract.set(contract);
    this.isFormOpen.set(true);
  }

  viewKits(contract: Contract): void {
    void this.router.navigate(['/equipment/kits'], {
      queryParams: {
        contractId: contract.id,
        companyId: contract.companyId,
        companyName: contract.companyName,
      },
    });
  }

  activateContract(contract: Contract): void {
    this.contractService.updateStatus(contract.id, { status: CONTRACT_STATUS.ACTIVE }).subscribe({
      next: () => {
        this.notificationService.success('Contrato ativado com sucesso!');
        this.loadContracts();
      },
      error: () => {
        this.notificationService.error('Erro ao ativar contrato.');
      },
    });
  }

  suspendContract(contract: Contract): void {
    this.contractService
      .updateStatus(contract.id, { status: CONTRACT_STATUS.SUSPENDED })
      .subscribe({
        next: () => {
          this.notificationService.success('Contrato suspenso com sucesso!');
          this.loadContracts();
        },
        error: () => {
          this.notificationService.error('Erro ao suspender contrato.');
        },
      });
  }

  onFormSubmit(data: ContractRequest): void {
    const selected = this.selectedContract();
    if (selected) {
      this.contractService.update(selected.id, data).subscribe({
        next: () => {
          this.notificationService.success('Contrato atualizado com sucesso!');
          this.closeForm();
          this.loadContracts();
        },
        error: () => {
          this.notificationService.error('Erro ao atualizar contrato.');
        },
      });
    } else {
      this.contractService.create(data).subscribe({
        next: () => {
          this.notificationService.success('Contrato criado com sucesso!');
          this.closeForm();
          this.loadContracts();
        },
        error: () => {
          this.notificationService.error('Erro ao criar contrato.');
        },
      });
    }
  }
}
