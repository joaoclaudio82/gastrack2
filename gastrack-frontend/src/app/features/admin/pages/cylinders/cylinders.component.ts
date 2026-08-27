import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { AddressService } from '@core/services/address.service';
import { CompanyService } from '@core/services/company.service';
import { CylinderModelService } from '@core/services/cylinder-model.service';
import { CylinderService } from '@core/services/cylinder.service';
import { NotificationService } from '@core/services/notification.service';
import { PontoGasService } from '@core/services/ponto-gas.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { GAS_TYPE_LABELS } from '@models/cylinder-model.model';
import type { Cylinder, CylinderRequest } from '@models/cylinder.model';
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
import { InputComponent } from '@shared/components/ui/input/input.component';
import { LoadingSpinnerComponent } from '@shared/components/ui/loading-spinner/loading-spinner.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '@shared/components/ui/select/select.component';
import { CylinderFormComponent } from '../../components/cylinder-form/cylinder-form.component';

@Component({
  selector: 'app-admin-cylinders',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    ActionMenuComponent,
    BreadcrumbComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    CylinderFormComponent,
  ],
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Cilindros</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Gerencie o cadastro de cilindros e dispositivos monitorados.
          </p>
        </div>
        <app-button variant="primary" class="flex-shrink-0" (buttonClick)="openCreateForm()">
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
          Novo Cilindro
        </app-button>
      </div>

      <div class="bg-card border border-border rounded-sm p-4 shadow-sm space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <app-input
            label="Buscar"
            placeholder="Nº de série"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange($event)"
            autocomplete="off"
          />

          <app-select
            label="Empresa"
            [options]="companyFilterOptions()"
            [(ngModel)]="companyFilter"
            (ngModelChange)="onCompanyChange($event)"
            [clearable]="true"
          />

          <app-select
            label="Endereço"
            [options]="addressFilterOptions()"
            [(ngModel)]="addressFilter"
            (ngModelChange)="onAddressChange($event)"
            [clearable]="true"
          />
        </div>

        <div class="flex flex-wrap gap-3 justify-end">
          <app-button variant="outline" (buttonClick)="clearFilters()">Limpar filtros</app-button>
          <app-button variant="secondary" (buttonClick)="applyFilters()">
            Aplicar filtros
          </app-button>
        </div>
      </div>

      @if (error()) {
        <div class="bg-destructive/10 border border-destructive/20 rounded-sm p-4 text-destructive">
          {{ error() }}
        </div>
      }

      @if (isLoading() && displayedCylinders().length === 0) {
        <div class="flex justify-center items-center py-12">
          <app-loading-spinner size="lg" variant="primary" />
        </div>
      } @else if (!isLoading() && displayedCylinders().length === 0) {
        <app-empty-state
          title="Nenhum cilindro cadastrado"
          description="Cadastre o primeiro cilindro para iniciar o monitoramento."
          action="Novo Cilindro"
          (actionClick)="openCreateForm()"
        />
      } @else {
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Nº Série
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Tipo de gás
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Volume
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Capacidade
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Preço/m³
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Atualizado em
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Situação
              </th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Ações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (cylinder of displayedCylinders(); track cylinder.id) {
              <tr>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">
                    {{ cylinder.serialNumber }}
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ gasTypeLabel(cylinder) }}</span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ cylinder.waterVolumeLiters | number: '1.0-1' }} L
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ cylinder.capacityBar | number: '1.0-0' }} bar
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ cylinder.pricePerM3 | number: '1.2-2' }}
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ cylinder.updatedAt | date: 'short' }}
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  @if (cylinder.active) {
                    <app-badge variant="success">Ativo</app-badge>
                  } @else {
                    <app-badge variant="default">Inativo</app-badge>
                  }
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <div class="flex justify-start">
                    <app-action-menu [items]="rowActions(cylinder)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-cylinder-form
      [isOpen]="isFormOpen()"
      [cylinder]="selectedCylinder()"
      [isLoading]="isLoading()"
      [modelOptions]="modelOptions()"
      [modelGasTypeById]="modelGasTypeById()"
      [lineGasTypeById]="lineGasTypeById()"
      [companyOptions]="companyService.companyOptions()"
      [pontoOptions]="pontoOptions()"
      [addressOptions]="addressService.addressOptions()"
      [defaultCompanyId]="defaultCompanyId()"
      [defaultPontoGasId]="pontoGasIdFromQuery()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />

    <app-modal
      [isOpen]="isDeactivateModalOpen()"
      title="Desativar Cilindro"
      size="sm"
      (closed)="closeDeactivateModal()"
    >
      <p class="text-sm text-muted-foreground">
        Deseja realmente desativar o cilindro
        <strong class="text-foreground">{{ cylinderToDeactivate()?.serialNumber }}</strong>
        ?
      </p>

      <div modal-footer>
        <app-button variant="outline" (buttonClick)="closeDeactivateModal()">Cancelar</app-button>
        <app-button variant="destructive" (buttonClick)="confirmDeactivation()">
          Desativar
        </app-button>
      </div>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CylindersComponent implements OnInit, OnDestroy {
  private readonly cylinderService = inject(CylinderService);
  private readonly route = inject(ActivatedRoute);
  readonly addressService = inject(AddressService);
  readonly companyService = inject(CompanyService);
  readonly cylinderModelService = inject(CylinderModelService);
  readonly pontoGasService = inject(PontoGasService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly displayedCylinders = this.cylinderService.filteredCylinders;
  readonly isLoading = this.cylinderService.isLoading;
  readonly error = this.cylinderService.error;
  readonly pagination = this.cylinderService.pagination;

  readonly isFormOpen = signal(false);
  readonly isDeactivateModalOpen = signal(false);
  readonly cylinderToDeactivate = signal<Cylinder | null>(null);
  readonly selectedCylinder = signal<Cylinder | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  searchTerm = '';
  addressFilter: number | null = null;
  companyFilter: number | null = null;

  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

  gasTypeLabel(cylinder: Cylinder): string {
    return GAS_TYPE_LABELS[cylinder.gasType] ?? '—';
  }

  readonly addressFilterOptions = computed<SelectOption[]>(() => [
    { label: 'Todos os endereços', value: null },
    ...this.addressService.addressOptions(),
  ]);

  readonly companyFilterOptions = computed<SelectOption[]>(() => [
    { label: 'Todas as empresas', value: null },
    ...this.companyService.companyOptions(),
  ]);

  readonly modelOptions = computed<SelectOption[]>(() =>
    this.cylinderModelService.models().map((model) => ({
      label: `${model.codigo} — ${GAS_TYPE_LABELS[model.gasType] ?? model.gasType} ${model.waterVolumeLiters}L/${model.capacityBar}bar`,
      value: model.id,
    })),
  );

  /** Gás de cada modelo e de cada linha — o form usa para não oferecer combinação que o backend recusa. */
  readonly modelGasTypeById = computed<Record<number, string>>(() =>
    Object.fromEntries(
      this.cylinderModelService.models().map((model) => [model.id, model.gasType]),
    ),
  );

  /**
   * Limite conhecido: `ponto.gasType` é derivado só dos cascos **conectados**, enquanto o
   * GasLinePolicy valida contra todos os **ativos**. Uma linha cujo único casco está de válvula
   * fechada se diz sem gás, o filtro libera todos os modelos e o 409 volta no submit — agora
   * traduzido, mas ainda um 409. Alinhar as duas pontas é decisão de domínio: mudar
   * `PontoGas.getGasType()` contraria `should_FallBack_When_EveryCylinderIsDisconnected`, que
   * codifica a leitura oposta (gás é o que o sensor mede).
   */
  readonly lineGasTypeById = computed<Record<number, string | null>>(() =>
    Object.fromEntries(this.pontoGasService.gasPoints().map((ponto) => [ponto.id, ponto.gasType])),
  );

  readonly pontoOptions = computed<SelectOption[]>(() =>
    this.pontoGasService.gasPoints().map((ponto) => ({
      label: ponto.location,
      value: ponto.id,
    })),
  );

  /** Linha de origem quando a tela é aberta pelo card ("Gerenciar cilindros"). */
  readonly pontoGasIdFromQuery = signal<number | null>(null);

  /** ADMIN não escolhe empresa: opera a própria, e o form não mostra o campo. */
  readonly defaultCompanyId = computed<number | null>(() => {
    if (this.authService.hasRole(UserRole.SUPER_ADMIN)) return null;
    const companyId = Number(this.authService.currentCompanyId());
    return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
  });

  ngOnInit(): void {
    // Chegando pelo card da linha ("Gerenciar cilindros"), a lista abre já filtrada —
    // sem isto o usuário caía em todos os cascos da empresa, sem saber de onde veio.
    const pontoGasId = Number(this.route.snapshot.queryParamMap.get('pontoGasId'));
    if (Number.isFinite(pontoGasId) && pontoGasId > 0) {
      this.cylinderService.updateFilters({ pontoGasId });
      this.pontoGasIdFromQuery.set(pontoGasId);
    }

    this.loadCylinders();
    this.addressService.getActive();
    // Sem estes dois, "Modelo" e "Ponto de Gás" ficam vazios e o form não fecha:
    // modelo é obrigatório, então o botão "Criar Cilindro" nunca habilita.
    this.cylinderModelService.getAll({ page: 1, pageSize: 100 });
    this.pontoGasService.getAll({ page: 1, pageSize: 200 }, true);
    // /companies/active é SUPER_ADMIN-only; sem o guard, ADMIN toma 403 e o interceptor
    // joga a página inteira pra /errors/forbidden.
    if (this.authService.hasRole(UserRole.SUPER_ADMIN)) {
      this.companyService.getActive();
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
    }
  }

  loadCylinders(): void {
    this.cylinderService.getAll({
      page: this.currentPage(),
      pageSize: this.pageSize(),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCylinders();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadCylinders();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
    }
    this.searchDebounceHandle = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  onAddressChange(addressId: number | string | null): void {
    if (addressId === null || addressId === undefined || addressId === '') {
      this.addressFilter = null;
    } else if (typeof addressId === 'string') {
      this.addressFilter = Number(addressId);
    } else {
      this.addressFilter = addressId;
    }
    this.applyFilters();
  }

  onCompanyChange(companyId: number | string | null): void {
    if (companyId === null || companyId === undefined || companyId === '') {
      this.companyFilter = null;
    } else if (typeof companyId === 'string') {
      this.companyFilter = Number(companyId);
    } else {
      this.companyFilter = companyId;
    }
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
    const trimmedSearch = this.searchTerm.trim();
    this.cylinderService.updateFilters({
      searchTerm: trimmedSearch,
      addressId: this.addressFilter,
      companyId: this.companyFilter,
    });
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.addressFilter = null;
    this.companyFilter = null;
    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
    this.cylinderService.clearFilters();
    this.currentPage.set(1);
  }

  openCreateForm(): void {
    this.selectedCylinder.set(null);
    this.isFormOpen.set(true);
  }

  rowActions(cylinder: Cylinder): ActionMenuItem[] {
    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.editCylinder(cylinder);
        },
      },
      cylinder.active
        ? {
            label: 'Desativar',
            icon: 'toggle',
            action: () => {
              this.deactivateCylinder(cylinder);
            },
          }
        : {
            label: 'Ativar',
            icon: 'toggle',
            action: () => {
              this.activateCylinder(cylinder);
            },
          },
    ];
  }

  editCylinder(cylinder: Cylinder): void {
    this.selectedCylinder.set(cylinder);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedCylinder.set(null);
  }

  onFormSubmit(data: CylinderRequest): void {
    const current = this.selectedCylinder();
    if (current) {
      this.cylinderService.update(current.id, data).subscribe({
        next: () => {
          this.notificationService.success('Cilindro atualizado com sucesso!');
          this.closeForm();
          this.loadCylinders();
        },
        error: () => {
          this.notificationService.error('Erro ao atualizar cilindro.');
        },
      });
    } else {
      this.cylinderService.create(data).subscribe({
        next: () => {
          this.notificationService.success('Cilindro criado com sucesso!');
          this.closeForm();
          this.loadCylinders();
        },
        error: () => {
          this.notificationService.error('Erro ao criar cilindro.');
        },
      });
    }
  }

  activateCylinder(cylinder: Cylinder): void {
    this.cylinderService.activate(cylinder.id).subscribe({
      next: () => {
        this.notificationService.success('Cilindro ativado com sucesso!');
        this.loadCylinders();
      },
      error: () => {
        this.notificationService.error('Erro ao ativar cilindro.');
      },
    });
  }

  deactivateCylinder(cylinder: Cylinder): void {
    this.cylinderToDeactivate.set(cylinder);
    this.isDeactivateModalOpen.set(true);
  }

  closeDeactivateModal(): void {
    this.isDeactivateModalOpen.set(false);
    this.cylinderToDeactivate.set(null);
  }

  confirmDeactivation(): void {
    const cylinder = this.cylinderToDeactivate();
    if (!cylinder) return;

    this.cylinderService.deactivate(cylinder.id).subscribe({
      next: () => {
        this.notificationService.success('Cilindro desativado com sucesso!');
        this.closeDeactivateModal();
        this.loadCylinders();
      },
      error: () => {
        this.notificationService.error('Erro ao desativar cilindro.');
        this.closeDeactivateModal();
      },
    });
  }
}
