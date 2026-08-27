import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import { CylinderModelService } from '@core/services/cylinder-model.service';
import { NotificationService } from '@core/services/notification.service';
import { PontoGasService } from '@core/services/ponto-gas.service';
import { RefillService } from '@core/services/refill.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { PaginationParams } from '@models/api-response.model';
import { CONTRACT_STATUS } from '@models/contract.model';
import type { PontoGas, PontoGasRequest } from '@models/ponto-gas.model';
import type { RefillRequest } from '@models/refill.model';
import { UserRole } from '@models/role.model';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '@shared/components/ui/action-menu/action-menu.component';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';
import { extractApiErrorMessage } from '@shared/utils/api-error';
import { LineCylindersComponent } from '../../components/line-cylinders/line-cylinders.component';
import { PontoGasFormComponent } from '../../components/ponto-gas-form/ponto-gas-form.component';
import { RefillFormComponent } from '../../components/refill-form/refill-form.component';

@Component({
  selector: 'app-ponto-gas',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    ActionMenuComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    ComboboxComponent,
    SelectComponent,
    TableLoadingStateComponent,
    PontoGasFormComponent,
    LineCylindersComponent,
    RefillFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Pontos de Gás</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Gerencie os pontos de gás associados aos endereços.
          </p>
        </div>
        @if (canManage()) {
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
            Novo Ponto de Gás
          </app-button>
        }
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @if (isSuperAdmin()) {
          <app-combobox
            label="Empresa"
            placeholder="Selecione ou busque a empresa"
            [options]="companyOptionsForCombobox()"
            [ngModel]="selectedCompanyId()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="onCompanyFilterChange($event)"
            [loading]="companyService.isLoading()"
            emptyMessage="Nenhuma empresa encontrada"
            [clearable]="true"
          />
        }
        <app-select
          label="Contrato"
          placeholder="Selecione o contrato"
          [options]="contractOptions()"
          [ngModel]="selectedContractId()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="onContractFilterChange($event)"
          [disabledInput]="contractOptions().length === 0"
          [clearable]="true"
        />
        <app-select
          label="Endereço"
          placeholder="Selecione o endereço"
          [options]="addressOptions()"
          [ngModel]="selectedAddressId()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="onAddressFilterChange($event)"
          [disabledInput]="!selectedContractId() || addressOptions().length === 0"
          [clearable]="true"
        />
      </div>

      @if (pontoGasService.isLoading() && pontoGasService.gasPoints().length === 0) {
        <app-table-loading-state
          text="Carregando pontos de gás"
          hint="Buscando instalações vinculadas."
        />
      } @else if (pontoGasService.gasPoints().length === 0) {
        <app-empty-state
          title="Nenhum ponto de gás cadastrado"
          description="Cadastre o primeiro ponto de gás para os endereços da sua empresa."
          action="Cadastrar Ponto de Gás"
          (actionClick)="openForm()"
        />
      } @else {
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Sensores
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                title="Campo dedicado para informar a localização física do ponto de gás."
              >
                Localização física
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
            @for (ponto of pontoGasService.gasPoints(); track ponto.id) {
              <tr>
                <td class="px-6 py-4">
                  @if (ponto.equipments.length === 0) {
                    <span class="text-sm text-muted-foreground">Nenhum sensor vinculado</span>
                  } @else {
                    <div class="flex flex-col gap-2">
                      @for (equipment of ponto.equipments; track equipment.id) {
                        <div class="flex flex-wrap items-center gap-2 text-sm leading-tight">
                          <span class="font-semibold text-foreground">
                            {{ equipment.assetTag }}
                          </span>
                          <span class="text-muted-foreground">
                            {{ equipment.codigoSensor || equipment.serialNumber || '-' }}
                            @if (equipment.sensorPort) {
                              • Porta {{ equipment.sensorPort }}
                            }
                          </span>
                          <span
                            class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                            [class.bg-emerald-100]="equipment.active"
                            [class.text-emerald-800]="equipment.active"
                            [class.bg-slate-100]="!equipment.active"
                            [class.text-slate-800]="!equipment.active"
                          >
                            {{ equipment.active ? 'Ativo' : 'Inativo' }}
                          </span>
                        </div>
                      }
                    </div>
                  }
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">{{ ponto.location }}</span>
                    <span class="text-xs text-muted-foreground">
                      Endereço: {{ ponto.addressName }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (ponto.active) {
                    <app-badge variant="success">Ativo</app-badge>
                  } @else {
                    <app-badge variant="default">Inativo</app-badge>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ ponto.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex justify-start">
                    <!-- O menu não some para quem não gere: ver os cilindros e os
                         equipamentos da linha é leitura, e é o que o USER precisa.
                         Quem filtra o que aparece é rowActions. -->
                    <app-action-menu [items]="rowActions(ponto)" />
                  </div>
                </td>
              </tr>
              @if (expandedPontoId() === ponto.id) {
                <tr>
                  <td class="px-6 py-4 bg-muted" colspan="5">
                    <div class="space-y-5">
                      <!-- Sem isto o painel só fecha voltando no menu de ações, o que
                           ninguém acha: quem abriu espera fechar onde está olhando. -->
                      <div class="flex items-start justify-between gap-4">
                        <p class="text-sm font-semibold text-foreground">
                          {{ ponto.location }}
                        </p>
                        <app-button
                          variant="ghost"
                          size="sm"
                          [attr.aria-label]="'Fechar detalhes de ' + ponto.location"
                          (buttonClick)="collapseDetails()"
                        >
                          Fechar
                        </app-button>
                      </div>

                      <div class="space-y-2">
                        <h3 class="text-sm font-semibold text-foreground">
                          Cilindros desta linha de gás
                        </h3>
                        <app-line-cylinders
                          [pontoGas]="ponto"
                          [canManage]="canManage()"
                          (refillRequested)="openRefill($event)"
                          (manageRequested)="openCylinderManagement($event)"
                        />
                      </div>

                      <div class="space-y-2">
                        <h3 class="text-sm font-semibold text-foreground">
                          Equipamentos neste ponto de gás
                        </h3>
                        @if (ponto.equipments.length === 0) {
                          <p class="text-sm text-muted-foreground">
                            Nenhum sensor está associado a este ponto de gás.
                          </p>
                        } @else {
                          <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-border text-sm">
                              <thead>
                                <tr>
                                  <th class="px-3 py-2 text-left font-medium text-muted-foreground">
                                    ID
                                  </th>
                                  <th class="px-3 py-2 text-left font-medium text-muted-foreground">
                                    Asset Tag
                                  </th>
                                  <th class="px-3 py-2 text-left font-medium text-muted-foreground">
                                    Tipo
                                  </th>
                                  <th class="px-3 py-2 text-left font-medium text-muted-foreground">
                                    Serial / Código
                                  </th>
                                  <th class="px-3 py-2 text-left font-medium text-muted-foreground">
                                    Porta
                                  </th>
                                  <th class="px-3 py-2 text-left font-medium text-muted-foreground">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-border">
                                @for (equipment of ponto.equipments; track equipment.id) {
                                  <tr>
                                    <td class="px-3 py-2 whitespace-nowrap">{{ equipment.id }}</td>
                                    <td class="px-3 py-2 whitespace-nowrap">
                                      {{ equipment.assetTag }}
                                    </td>
                                    <td class="px-3 py-2 whitespace-nowrap">
                                      {{ equipment.equipmentTypeName }}
                                    </td>
                                    <td class="px-3 py-2 whitespace-nowrap">
                                      {{ equipment.codigoSensor || equipment.serialNumber || '-' }}
                                    </td>
                                    <td class="px-3 py-2 whitespace-nowrap">
                                      {{ equipment.sensorPort ?? '-' }}
                                    </td>
                                    <td class="px-3 py-2 whitespace-nowrap">
                                      <span
                                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                        [class.bg-emerald-100]="equipment.active"
                                        [class.text-emerald-800]="equipment.active"
                                        [class.bg-slate-100]="!equipment.active"
                                        [class.text-slate-800]="!equipment.active"
                                      >
                                        {{ equipment.active ? 'Ativo' : 'Inativo' }}
                                      </span>
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              }
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="pontoGasService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-ponto-gas-form
      [isOpen]="isFormOpen()"
      [pontoGas]="selectedPontoGas()"
      [isLoading]="pontoGasService.isLoading()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />

    <app-refill-form
      [isOpen]="isRefillOpen()"
      [pontoGas]="refillTarget()"
      [modelOptions]="cylinderModelOptions()"
      [isLoading]="refillService.isLoading()"
      (submitted)="onRefillSubmit($event)"
      (closed)="closeRefill()"
    />
  `,
})
export class PontoGasComponent implements OnInit {
  private readonly authService = inject(AuthService);
  readonly companyService = inject(CompanyService);
  readonly contractService = inject(ContractService);
  readonly pontoGasService = inject(PontoGasService);
  readonly refillService = inject(RefillService);
  readonly cylinderModelService = inject(CylinderModelService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isRefillOpen = signal(false);
  readonly refillTarget = signal<PontoGas | null>(null);

  /**
   * Só modelos do gás que a linha já carrega. O backend recusa gás misto no mesmo manifold
   * (GasLinePolicy), então oferecer o resto seria convidar o usuário a um erro. Linha sem
   * cilindro ainda não tem gás definido — aí vale qualquer modelo.
   */
  readonly cylinderModelOptions = computed<SelectOption[]>(() => {
    const lineGasType = this.refillTarget()?.gasType ?? null;
    return this.cylinderModelService
      .models()
      .filter((model) => lineGasType === null || model.gasType === lineGasType)
      .map((model) => ({
        label: `${model.codigo} · ${model.gasType}`,
        value: model.id,
      }));
  });

  readonly isFormOpen = signal(false);
  readonly selectedPontoGas = signal<PontoGas | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly expandedPontoId = signal<number | null>(null);
  readonly selectedCompanyId = signal<number | null>(null);
  readonly selectedContractId = signal<number | null>(null);
  readonly selectedAddressId = signal<number | null>(null);

  readonly companyOptionsForCombobox = computed(() =>
    this.companyService.activeCompanies().map((company) => ({
      label: company.name,
      value: company.id,
      disabled: false,
    })),
  );

  readonly contractOptions = computed<SelectOption[]>(() => {
    const companyId = this.selectedCompanyId();
    return this.contractService
      .contracts()
      .filter((contract) => (companyId != null ? contract.companyId === companyId : true))
      .map((contract) => ({
        label: `${contract.contractNumber} - ${contract.companyName}`,
        value: contract.id,
      }));
  });

  readonly addressOptions = computed<SelectOption[]>(() =>
    this.contractService.contractAddresses().map((address) => ({
      label: address.name || address.fullAddress,
      value: address.id,
    })),
  );

  ngOnInit(): void {
    this.initializeFilters();
    this.loadPontosGas();
    // Modelos alimentam o dropdown da troca de botijão — ação que o USER não tem.
    // /cylinder-models é ADMIN-only: sem o guard, o USER abria a lista de linhas
    // (que ele pode ver) e o 403 desta chamada derrubava a página pra /errors/forbidden.
    // pageSize explícito: o default do service é 10 e o 11º modelo sumia do dropdown.
    if (this.canManage()) {
      this.cylinderModelService.getAll({ page: 1, pageSize: 100 });
    }
  }

  openRefill(pontoGas: PontoGas): void {
    this.refillTarget.set(pontoGas);
    this.isRefillOpen.set(true);
  }

  closeRefill(): void {
    this.isRefillOpen.set(false);
    this.refillTarget.set(null);
  }

  onRefillSubmit(request: RefillRequest): void {
    const target = this.refillTarget();
    if (!target) {
      return;
    }

    this.refillService.registerRefill(target.id, request).subscribe({
      next: () => {
        this.notificationService.success('Troca registrada.');
        this.closeRefill();
        // Recarrega para a soma de volume da linha refletir o casco novo.
        this.loadPontosGas();
      },
      error: (error: unknown) => {
        this.notificationService.error(
          extractApiErrorMessage(error) ?? 'Não foi possível registrar a troca.',
        );
      },
    });
  }

  /**
   * Gerenciar cilindros ainda usa o CRUD dedicado. O painel dentro da linha
   * (decisão 3 do mockup) fica para a próxima fatia.
   */
  openCylinderManagement(pontoGas: PontoGas): void {
    void this.router.navigate(['/admin/cylinders'], {
      queryParams: { pontoGasId: pontoGas.id },
    });
  }

  loadPontosGas(): void {
    const params: PaginationParams = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const addressId = this.selectedAddressId();
    if (addressId != null) {
      this.pontoGasService.getByAddressId(addressId, params);
      return;
    }

    this.pontoGasService.getAll(params);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPontosGas();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadPontosGas();
  }

  onCompanyFilterChange(value: string | number | null): void {
    const parsed = this.parseSelectValue(value);
    this.selectedCompanyId.set(parsed);
    this.selectedContractId.set(null);
    this.selectedAddressId.set(null);
    this.currentPage.set(1);
    this.pontoGasService.clearList();
    this.loadPontosGas();

    if (parsed != null) {
      this.contractService.getByCompanyAndStatus(parsed, CONTRACT_STATUS.ACTIVE, {
        page: 1,
        pageSize: 200,
      });
    } else {
      this.contractService.getAll({ page: 1, pageSize: 200 }, { status: CONTRACT_STATUS.ACTIVE });
    }
  }

  onContractFilterChange(value: string | number | null): void {
    const parsed = this.parseSelectValue(value);
    this.selectedContractId.set(parsed);
    this.selectedAddressId.set(null);
    this.currentPage.set(1);
    this.pontoGasService.clearList();
    this.loadPontosGas();

    if (parsed != null) {
      this.contractService.getAllowedAddresses(parsed);
      if (this.isSuperAdmin()) {
        const contract = this.contractService.contracts().find((c) => c.id === parsed);
        if (contract) {
          this.selectedCompanyId.set(contract.companyId);
        }
      }
    }
  }

  onAddressFilterChange(value: string | number | null): void {
    const parsed = this.parseSelectValue(value);
    this.selectedAddressId.set(parsed);
    this.currentPage.set(1);
    this.pontoGasService.clearList();
    this.loadPontosGas();
  }

  private initializeFilters(): void {
    if (this.isSuperAdmin()) {
      this.companyService.getActive();
      this.contractService.getAll({ page: 1, pageSize: 200 }, { status: CONTRACT_STATUS.ACTIVE });
      return;
    }

    const companyId = this.getCurrentCompanyId();
    if (companyId != null) {
      this.selectedCompanyId.set(companyId);
      this.contractService.getByCompanyAndStatus(companyId, CONTRACT_STATUS.ACTIVE, {
        page: 1,
        pageSize: 200,
      });
    } else {
      this.contractService.getAll({ page: 1, pageSize: 200 }, { status: CONTRACT_STATUS.ACTIVE });
    }
  }

  private getCurrentCompanyId(): number | null {
    const companyId = this.authService.currentCompanyId();
    if (!companyId) return null;
    const parsed = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;
    return Number.isNaN(parsed) ? null : parsed;
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  /** USER observa a linha; montar, trocar e editar são de quem gere a operação. */
  canManage(): boolean {
    return this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  private parseSelectValue(value: string | number | null): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  openForm(): void {
    this.selectedPontoGas.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedPontoGas.set(null);
  }

  rowActions(ponto: PontoGas): ActionMenuItem[] {
    // Abrir os detalhes é leitura: vale para todo mundo. O resto muda a operação
    // e fica só para quem gere.
    const verDetalhes: ActionMenuItem = {
      // O rótulo acompanha o estado: "Equipamentos" quando abre, "Fechar detalhes"
      // quando já está aberto — o item alterna, e antes não dizia isso.
      label: this.expandedPontoId() === ponto.id ? 'Fechar detalhes' : 'Equipamentos',
      icon: 'view',
      action: () => {
        this.toggleEquipments(ponto);
      },
    };

    if (!this.canManage()) {
      return [verDetalhes];
    }

    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.editPontoGas(ponto);
        },
      },
      ponto.active
        ? {
            label: 'Desativar',
            icon: 'toggle',
            action: () => {
              this.deactivatePontoGas(ponto);
            },
          }
        : {
            label: 'Ativar',
            icon: 'toggle',
            action: () => {
              this.activatePontoGas(ponto);
            },
          },
      verDetalhes,
      {
        label: 'Excluir',
        icon: 'delete',
        variant: 'destructive',
        action: () => {
          this.deletePontoGas(ponto);
        },
      },
    ];
  }

  editPontoGas(ponto: PontoGas): void {
    this.selectedPontoGas.set(ponto);
    this.isFormOpen.set(true);
  }

  collapseDetails(): void {
    this.expandedPontoId.set(null);
  }

  toggleEquipments(ponto: PontoGas): void {
    const current = this.expandedPontoId();
    this.expandedPontoId.set(current === ponto.id ? null : ponto.id);
  }

  onFormSubmit(request: PontoGasRequest): void {
    const selected = this.selectedPontoGas();
    if (selected) {
      this.pontoGasService.update(selected.id, request).subscribe({
        next: () => {
          this.notificationService.success('Ponto de gás atualizado com sucesso!');
          this.closeForm();
          this.loadPontosGas();
        },
        error: () => {
          this.notificationService.error('Erro ao atualizar ponto de gás.');
        },
      });
    } else {
      this.pontoGasService.create(request).subscribe({
        next: () => {
          this.notificationService.success('Ponto de gás criado com sucesso!');
          this.closeForm();
          this.loadPontosGas();
        },
        error: () => {
          this.notificationService.error('Erro ao criar ponto de gás.');
        },
      });
    }
  }

  activatePontoGas(ponto: PontoGas): void {
    this.pontoGasService.activate(ponto.id).subscribe({
      next: () => {
        this.notificationService.success('Ponto de gás ativado com sucesso!');
        this.loadPontosGas();
      },
      error: () => {
        this.notificationService.error('Erro ao ativar ponto de gás.');
      },
    });
  }

  deactivatePontoGas(ponto: PontoGas): void {
    if (!confirm('Tem certeza que deseja desativar este ponto de gás?')) return;

    this.pontoGasService.deactivate(ponto.id).subscribe({
      next: () => {
        this.notificationService.success('Ponto de gás desativado com sucesso!');
        this.loadPontosGas();
      },
      error: () => {
        this.notificationService.error('Erro ao desativar ponto de gás.');
      },
    });
  }

  deletePontoGas(ponto: PontoGas): void {
    if (!confirm('Tem certeza que deseja excluir este ponto de gás?')) return;

    this.pontoGasService.delete(ponto.id).subscribe({
      next: () => {
        this.notificationService.success('Ponto de gás excluído com sucesso!');
        this.loadPontosGas();
      },
      error: () => {
        this.notificationService.error('Erro ao excluir ponto de gás.');
      },
    });
  }
}
