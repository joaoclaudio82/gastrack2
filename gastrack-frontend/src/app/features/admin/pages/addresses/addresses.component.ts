import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { AddressService } from '@core/services/address.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { Address, AddressRequest } from '@models/address.model';
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
import { AddressFormComponent } from '../../components/address-form/address-form.component';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [
    ActionMenuComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    AddressFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Endereços</h1>
          <p class="text-sm text-muted-foreground mt-1">Gerencie os endereços da empresa</p>
        </div>
        <app-button
          variant="primary"
          class="flex-shrink-0 whitespace-nowrap"
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
          Novo Endereço
        </app-button>
      </div>

      @if (addressService.isLoading() && addressService.addresses().length === 0) {
        <app-table-loading-state
          text="Carregando endereços"
          hint="Buscando registros cadastrados."
        />
      } @else if (addressService.addresses().length === 0) {
        <app-empty-state
          title="Nenhum endereço cadastrado"
          description="Cadastre o primeiro endereço da sua empresa."
          action="Cadastrar Endereço"
          (actionClick)="openForm()"
        />
      } @else {
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Nome
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Endereço
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Cidade
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Estado
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
            @for (address of addressService.addresses(); track address.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">{{ address.name }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-muted-foreground">{{ address.fullAddress }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ address.cityName }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ address.stateName }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (address.active) {
                    <app-badge variant="success">Ativo</app-badge>
                  } @else {
                    <app-badge variant="default">Inativo</app-badge>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex justify-start">
                    <app-action-menu [items]="rowActions(address)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="addressService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-address-form
      [isOpen]="isFormOpen()"
      [address]="selectedAddress()"
      [preselectedCompanyId]="preselectedCompanyId()"
      [preselectedCompanyName]="preselectedCompanyName()"
      [isLoading]="addressService.isLoading()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />
  `,
})
export class AddressesComponent implements OnInit {
  readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isFormOpen = signal(false);
  readonly selectedAddress = signal<Address | null>(null);
  readonly preselectedCompanyId = signal<number | null>(null);
  readonly preselectedCompanyName = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const companyId = params['companyId'];
      const companyName = params['companyName'];
      const openForm = params['openForm'] === 'true';

      if (companyId) {
        this.preselectedCompanyId.set(Number(companyId));
      }
      if (companyName) {
        this.preselectedCompanyName.set(companyName);
      }
      if (openForm) {
        this.selectedAddress.set(null);
        this.isFormOpen.set(true);
      }
    });
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.addressService.getAll({
      page: this.currentPage(),
      pageSize: this.pageSize(),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAddresses();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadAddresses();
  }

  openForm(): void {
    this.selectedAddress.set(null);
    this.preselectedCompanyId.set(null);
    this.preselectedCompanyName.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedAddress.set(null);
    this.preselectedCompanyId.set(null);
    this.preselectedCompanyName.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  rowActions(address: Address): ActionMenuItem[] {
    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.editAddress(address);
        },
      },
      address.active
        ? {
            label: 'Desativar',
            icon: 'toggle',
            action: () => {
              this.deactivateAddress(address);
            },
          }
        : {
            label: 'Ativar',
            icon: 'toggle',
            action: () => {
              this.activateAddress(address);
            },
          },
      {
        label: 'Excluir',
        icon: 'delete',
        variant: 'destructive',
        action: () => {
          this.deleteAddress(address);
        },
      },
    ];
  }

  editAddress(address: Address): void {
    this.selectedAddress.set(address);
    this.isFormOpen.set(true);
  }

  onFormSubmit(data: AddressRequest): void {
    const selected = this.selectedAddress();
    if (selected) {
      this.addressService.update(selected.id, data).subscribe({
        next: () => {
          this.notificationService.success('Endereço atualizado com sucesso!');
          this.closeForm();
          this.loadAddresses();
        },
        error: () => {
          this.notificationService.error('Erro ao atualizar endereço.');
        },
      });
    } else {
      this.addressService.create(data).subscribe({
        next: () => {
          this.notificationService.success('Endereço criado com sucesso!');
          this.closeForm();
          this.loadAddresses();
        },
        error: () => {
          this.notificationService.error('Erro ao criar endereço.');
        },
      });
    }
  }

  activateAddress(address: Address): void {
    this.addressService.activate(address.id).subscribe({
      next: () => {
        this.notificationService.success('Endereço ativado com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao ativar endereço.');
      },
    });
  }

  deactivateAddress(address: Address): void {
    this.addressService.deactivate(address.id).subscribe({
      next: () => {
        this.notificationService.success('Endereço desativado com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao desativar endereço.');
      },
    });
  }

  deleteAddress(address: Address): void {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;

    this.addressService.delete(address.id).subscribe({
      next: () => {
        this.notificationService.success('Endereço excluído com sucesso!');
        this.loadAddresses();
      },
      error: () => {
        this.notificationService.error('Erro ao excluir endereço.');
      },
    });
  }
}
