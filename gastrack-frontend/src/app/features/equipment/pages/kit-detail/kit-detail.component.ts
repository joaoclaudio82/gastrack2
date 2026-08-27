import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import { EquipmentService } from '@core/services/equipment.service';
import { MovementHistoryService } from '@core/services/movement-history.service';
import { NotificationService } from '@core/services/notification.service';
import { TankStatusBadgeComponent } from '@features/cylinders/components/tank-status-badge/tank-status-badge.component';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { BadgeVariant } from '@models/badge.types';
import { GAS_TYPE_LABELS, type GasType } from '@models/cylinder-model.model';
import {
  canInstallKit,
  canUninstallKit,
  KIT_STATUS,
  KIT_STATUS_LABELS,
  KIT_STATUS_VARIANTS,
  type KitStatus,
} from '@models/equipment-kit.model';
import type { BatchAssignmentError, Equipment } from '@models/equipment.model';
import { EQUIPMENT_CONDITION_LABELS, EQUIPMENT_CONDITION_VARIANTS } from '@models/equipment.model';
import {
  MOVEMENT_OPERATION,
  MOVEMENT_OPERATION_LABELS,
  type MovementOperation,
} from '@models/movement-history.model';
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
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';
import { TooltipDirective } from '@shared/directives';
import { translateBackendMessage } from '@shared/utils/api-error';
import {
  EquipmentAssignModalComponent,
  type EquipmentBatchAssignResult,
} from '../../components/equipment-assign-modal/equipment-assign-modal.component';
import {
  EquipmentTransferModalComponent,
  type EquipmentTransferResult,
} from '../../components/equipment-transfer-modal/equipment-transfer-modal.component';
import {
  KitInstallModalComponent,
  type KitInstallResult,
} from '../../components/kit-install-modal/kit-install-modal.component';
import {
  KitRelocateModalComponent,
  type KitRelocateResult,
} from '../../components/kit-relocate-modal/kit-relocate-modal.component';
import {
  KitSwapModalComponent,
  type KitSwapResult,
  type SwapMode,
} from '../../components/kit-swap-modal/kit-swap-modal.component';
import {
  KitUninstallModalComponent,
  type KitUninstallResult,
} from '../../components/kit-uninstall-modal/kit-uninstall-modal.component';

const OPERATION_VARIANTS: Record<string, BadgeVariant> = {
  [MOVEMENT_OPERATION.CREATED]: 'success',
  [MOVEMENT_OPERATION.ASSIGNED_TO_KIT]: 'info',
  [MOVEMENT_OPERATION.REMOVED_FROM_KIT]: 'warning',
  [MOVEMENT_OPERATION.TRANSFERRED]: 'info',
  [MOVEMENT_OPERATION.CONDITION_CHANGED]: 'default',
  [MOVEMENT_OPERATION.DEACTIVATED]: 'destructive',
  [MOVEMENT_OPERATION.REACTIVATED]: 'success',
  [MOVEMENT_OPERATION.KIT_CREATED]: 'success',
  [MOVEMENT_OPERATION.KIT_INSTALLED]: 'success',
  [MOVEMENT_OPERATION.KIT_MAINTENANCE_START]: 'warning',
  [MOVEMENT_OPERATION.KIT_MAINTENANCE_END]: 'success',
  [MOVEMENT_OPERATION.KIT_REMOVED]: 'destructive',
  [MOVEMENT_OPERATION.KIT_DECOMMISSIONED]: 'destructive',
};

@Component({
  selector: 'app-kit-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ActionMenuComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    SelectComponent,
    TableLoadingStateComponent,
    EquipmentAssignModalComponent,
    EquipmentTransferModalComponent,
    KitInstallModalComponent,
    KitRelocateModalComponent,
    KitSwapModalComponent,
    KitUninstallModalComponent,
    TankStatusBadgeComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      @if (kitService.selectedKit(); as kit) {
        <!-- Kit Header -->
        <div class="bg-card rounded-sm border border-border p-4 sm:p-6 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex-1 min-w-[220px]">
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 class="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {{ kit.kitCode }}
                </h1>
                <app-badge [variant]="getKitStatusVariant(kit.status)">
                  {{ getKitStatusLabel(kit.status) }}
                </app-badge>
              </div>
              <p class="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                Contrato: {{ kit.contractNumber }} | Empresa: {{ kit.companyName }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2 sm:justify-end">
              @if (isSuperAdmin()) {
                <span
                  class="flex-1 sm:flex-none min-w-[120px]"
                  [appTooltip]="
                    canInstall() ? '' : 'Só é possível instalar um kit pendente ou removido.'
                  "
                >
                  <app-button
                    variant="primary"
                    size="sm"
                    [disabled]="!canInstall()"
                    (buttonClick)="openInstallModal()"
                    class="w-full"
                  >
                    Instalar Kit
                  </app-button>
                </span>
                <span
                  class="flex-1 sm:flex-none min-w-[130px]"
                  [appTooltip]="canUninstall() ? '' : 'Só é possível desinstalar um kit instalado.'"
                >
                  <app-button
                    variant="destructive"
                    size="sm"
                    [disabled]="!canUninstall()"
                    (buttonClick)="openUninstallModal()"
                    class="w-full"
                  >
                    Desinstalar Kit
                  </app-button>
                </span>
              }
              @if (isSuperAdmin()) {
                <app-button
                  variant="outline"
                  size="sm"
                  (buttonClick)="openRelocateModal()"
                  class="flex-1 sm:flex-none min-w-[120px]"
                >
                  Migrar Kit
                </app-button>
              }
              @if (isSuperAdmin()) {
                <span
                  class="flex-1 sm:flex-none min-w-[110px]"
                  [appTooltip]="canMaintain() ? '' : 'Disponível apenas com o kit instalado.'"
                >
                  <app-button
                    variant="outline"
                    size="sm"
                    [disabled]="!canMaintain()"
                    (buttonClick)="openSwapEsp()"
                    class="w-full"
                  >
                    Trocar ESP
                  </app-button>
                </span>
                <span
                  class="flex-1 sm:flex-none min-w-[130px]"
                  [appTooltip]="canMaintain() ? '' : 'Disponível apenas com o kit instalado.'"
                >
                  <app-button
                    variant="outline"
                    size="sm"
                    [disabled]="!canMaintain()"
                    (buttonClick)="openSwapSensor()"
                    class="w-full"
                  >
                    Trocar Sensor
                  </app-button>
                </span>
              }
              @if (isSuperAdmin()) {
                <app-button
                  variant="outline"
                  size="sm"
                  (buttonClick)="addEquipment()"
                  class="flex-1 sm:flex-none min-w-[140px]"
                >
                  Adicionar Equipamento
                </app-button>
              }
              <app-button
                variant="outline"
                size="sm"
                (buttonClick)="goBack()"
                class="flex-1 sm:flex-none min-w-[80px]"
              >
                Voltar
              </app-button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <span class="text-xs text-muted-foreground uppercase">Endereço</span>
              <p class="text-sm font-medium">
                @if (isInstalled(kit.status) && kit.addressName) {
                  {{ kit.addressName }}
                } @else {
                  -
                }
              </p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground uppercase">Instalação</span>
              <p class="text-sm font-medium">
                @if (isInstalled(kit.status) && kit.installationDate) {
                  {{ kit.installationDate | date: 'dd/MM/yyyy' }}
                } @else {
                  Pendente
                }
              </p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground uppercase">Equipamentos</span>
              <p class="text-sm font-medium">{{ kit.equipmentCount }}</p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground uppercase">Criado em</span>
              <p class="text-sm font-medium">{{ kit.createdAt | date: 'dd/MM/yyyy' }}</p>
            </div>
          </div>
        </div>

        <!-- Equipments Section -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-foreground">Equipamentos</h2>

          @if (equipmentService.isLoading() && equipmentService.equipments().length === 0) {
            <app-table-loading-state
              text="Carregando equipamentos"
              hint="Buscando equipamentos vinculados ao kit."
            />
          } @else if (equipmentService.equipments().length === 0) {
            <app-empty-state
              title="Nenhum equipamento"
              description="Este kit ainda não possui equipamentos."
              [action]="isSuperAdmin() ? 'Adicionar Equipamento' : ''"
              (actionClick)="addEquipment()"
            />
          } @else {
            <app-data-table>
              <ng-container data-table-head>
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Asset Tag
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Serial
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Condição
                  </th>
                  @if (isSuperAdmin()) {
                    <th
                      class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Ações
                    </th>
                  }
                </tr>
              </ng-container>

              <ng-container data-table-body>
                @for (equipment of equipmentService.equipments(); track equipment.id) {
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium text-foreground">
                        {{ equipment.assetTag }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-muted-foreground">
                        {{ equipment.equipmentTypeName }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-muted-foreground">
                        {{ equipment.serialNumber || '-' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <app-badge [variant]="getConditionVariant(equipment.condition)">
                        {{ getConditionLabel(equipment.condition) }}
                      </app-badge>
                    </td>
                    @if (isSuperAdmin()) {
                      <td class="px-3 sm:px-6 py-4">
                        <div class="flex justify-end">
                          <app-action-menu [items]="equipmentActions(equipment)" />
                        </div>
                      </td>
                    }
                  </tr>
                }
              </ng-container>
              <app-data-table-footer
                data-table-footer
                [pagination]="equipmentService.pagination()"
                (pageChange)="onEquipmentPageChange($event)"
                (pageSizeChange)="onEquipmentPageSizeChange($event)"
              />
            </app-data-table>
          }
        </div>

        <!-- Cylinders Section (via ponto de gás; presente só no detalhe) -->
        @if (kit.cylinders && kit.cylinders.length > 0) {
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-foreground">Cilindros</h2>
            <app-data-table>
              <ng-container data-table-head>
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Serial
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Tipo de gás
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Ponto de gás
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Pressão
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </ng-container>
              <ng-container data-table-body>
                @for (cylinder of kit.cylinders; track cylinder.cylinderId) {
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium text-foreground">
                        {{ cylinder.serialNumber }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-muted-foreground">
                        {{ getGasTypeLabel(cylinder.gasType) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-muted-foreground">
                        {{ cylinder.pontoGasName || '-' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-muted-foreground">
                        {{
                          cylinder.currentPressureBar !== null
                            ? cylinder.currentPressureBar + ' bar'
                            : '-'
                        }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <app-tank-status-badge [status]="cylinder.status" />
                    </td>
                  </tr>
                }
              </ng-container>
            </app-data-table>
          </div>
        }

        <!-- History Section -->
        <div class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-lg font-semibold text-foreground">Histórico de Movimentações</h2>
            @if (historyService.history().length > 0 || historyFilter() !== 'all') {
              <app-select
                class="w-full sm:w-64"
                placeholder="Filtrar por operação"
                [options]="historyFilterOptions"
                [ngModel]="historyFilter()"
                (ngModelChange)="onHistoryFilterChange($event)"
              />
            }
          </div>

          @if (historyService.isLoading() && historyService.history().length === 0) {
            <app-table-loading-state
              text="Carregando movimentações"
              hint="Buscando o histórico deste kit."
            />
          } @else if (historyService.history().length === 0 && historyFilter() === 'all') {
            <div class="bg-card rounded-sm border border-border p-8 text-center">
              <p class="text-muted-foreground">Nenhuma movimentação registrada</p>
            </div>
          } @else {
            <div class="bg-card rounded-sm border border-border overflow-hidden">
              <app-data-table>
                <ng-container data-table-head>
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Operação
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Descrição
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Data
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Usuário
                    </th>
                  </tr>
                </ng-container>
                <ng-container data-table-body>
                  @for (entry of historyService.history(); track entry.id) {
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <app-badge [variant]="getHistoryVariant(entry.operation)">
                          {{ getOperationLabel(entry.operation) }}
                        </app-badge>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-muted-foreground">
                          @if (entry.equipmentAssetTag) {
                            {{ entry.equipmentAssetTag }}
                          }
                          @if (entry.kitCode) {
                            Kit: {{ entry.kitCode }}
                          }
                          @if (entry.notes) {
                            — {{ entry.notes }}
                          }
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-muted-foreground">
                          {{ entry.operationAt | date: 'dd/MM/yyyy HH:mm' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-muted-foreground">
                          {{ entry.userName || '-' }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="px-6 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma movimentação para este filtro.
                      </td>
                    </tr>
                  }
                </ng-container>
                <app-data-table-footer
                  data-table-footer
                  [pagination]="historyService.pagination()"
                  (pageChange)="onHistoryPageChange($event)"
                  (pageSizeChange)="onHistoryPageSizeChange($event)"
                />
              </app-data-table>
            </div>
          }
        </div>
      } @else {
        <div class="flex items-center justify-center h-64">
          <p class="text-muted-foreground">Carregando...</p>
        </div>
      }
    </div>

    <app-equipment-assign-modal
      [isOpen]="isAssignModalOpen()"
      [kitId]="kitId() ?? 0"
      [isLoading]="equipmentService.isLoading()"
      (submitted)="onEquipmentAssign($event)"
      (closed)="closeAssignModal()"
    />

    <app-equipment-transfer-modal
      [isOpen]="isTransferModalOpen()"
      [equipment]="selectedEquipmentForTransfer()"
      [isLoading]="equipmentService.isLoading()"
      (submitted)="onEquipmentTransfer($event)"
      (closed)="closeTransferModal()"
    />

    <app-kit-install-modal
      [isOpen]="isInstallModalOpen()"
      [kit]="kitService.selectedKit()"
      [isLoading]="kitService.isLoading()"
      (submitted)="onKitInstall($event)"
      (closed)="closeInstallModal()"
    />

    <app-kit-relocate-modal
      [isOpen]="isRelocateModalOpen()"
      [kit]="kitService.selectedKit()"
      [isLoading]="kitService.isLoading()"
      (submitted)="onKitRelocate($event)"
      (closed)="closeRelocateModal()"
    />

    <app-kit-uninstall-modal
      [isOpen]="isUninstallModalOpen()"
      [kit]="kitService.selectedKit()"
      [isLoading]="kitService.isLoading()"
      (submitted)="onKitUninstall($event)"
      (closed)="closeUninstallModal()"
    />

    <app-kit-swap-modal
      [isOpen]="isSwapModalOpen()"
      [mode]="swapMode()"
      [kitCode]="kitService.selectedKit()?.kitCode ?? ''"
      [currentEquipments]="equipmentService.equipments()"
      [candidates]="swapCandidates()"
      [isLoading]="kitService.isLoading()"
      (submitted)="onKitSwap($event)"
      (closed)="closeSwapModal()"
    />
  `,
})
export class KitDetailComponent implements OnInit {
  readonly kitService = inject(EquipmentKitService);
  readonly equipmentService = inject(EquipmentService);
  readonly historyService = inject(MovementHistoryService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly kitId = signal<number | null>(null);
  readonly equipmentPage = signal(1);
  readonly equipmentPageSize = signal(10);
  readonly historyPage = signal(1);
  readonly historyPageSize = signal(10);

  /** Filtro por operação do histórico (server-side via query param em getByKit). */
  readonly historyFilter = signal<MovementOperation | 'all'>('all');

  /** Opções do filtro: todas as operações (o filtro é server-side, não depende da página). */
  readonly historyFilterOptions: { label: string; value: MovementOperation | 'all' }[] = [
    { label: 'Todas as operações', value: 'all' },
    ...(Object.keys(MOVEMENT_OPERATION_LABELS) as MovementOperation[]).map((op) => ({
      label: MOVEMENT_OPERATION_LABELS[op],
      value: op as MovementOperation | 'all',
    })),
  ];
  readonly isAssignModalOpen = signal(false);
  readonly isTransferModalOpen = signal(false);
  readonly isInstallModalOpen = signal(false);
  readonly isRelocateModalOpen = signal(false);
  readonly isUninstallModalOpen = signal(false);
  readonly isSwapModalOpen = signal(false);
  readonly swapMode = signal<SwapMode>('esp');
  readonly swapCandidates = signal<Equipment[]>([]);
  readonly selectedEquipmentForTransfer = signal<Equipment | null>(null);

  // Computed signals for conditional buttons
  readonly canInstall = computed(() => {
    const kit = this.kitService.selectedKit();
    return kit && canInstallKit(kit.status);
  });

  readonly canUninstall = computed(() => {
    const kit = this.kitService.selectedKit();
    return kit && canUninstallKit(kit.status);
  });

  /** Hardware swap (trocar ESP/sensor) só faz sentido com o kit vivo em campo. */
  readonly canMaintain = computed(() => {
    const kit = this.kitService.selectedKit();
    return (
      kit != null && (kit.status === KIT_STATUS.INSTALLED || kit.status === KIT_STATUS.MAINTENANCE)
    );
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.kitId.set(Number(id));
      this.loadKit(Number(id));
    }
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  /**
   * Check if kit has been installed (status indicates past installation)
   */
  isInstalled(status: KitStatus): boolean {
    return (
      status === KIT_STATUS.INSTALLED ||
      status === KIT_STATUS.MAINTENANCE ||
      status === KIT_STATUS.DECOMMISSIONED
    );
  }

  loadKit(id: number): void {
    this.kitService.getById(id).subscribe({
      next: () => {
        this.loadEquipment(id);
        this.loadHistory(id);
      },
      error: () => {
        this.notificationService.error('Erro ao carregar kit.');
        void this.router.navigate(['/equipment/kits']);
      },
    });
  }

  getKitStatusLabel(status: string): string {
    return KIT_STATUS_LABELS[status as keyof typeof KIT_STATUS_LABELS] ?? status;
  }

  getKitStatusVariant(status: string): BadgeVariant {
    return KIT_STATUS_VARIANTS[status as keyof typeof KIT_STATUS_VARIANTS] ?? 'default';
  }

  getGasTypeLabel(gasType: GasType): string {
    return GAS_TYPE_LABELS[gasType] ?? gasType;
  }

  getConditionLabel(condition: string): string {
    return (
      EQUIPMENT_CONDITION_LABELS[condition as keyof typeof EQUIPMENT_CONDITION_LABELS] ?? condition
    );
  }

  getConditionVariant(condition: string): BadgeVariant {
    return (
      EQUIPMENT_CONDITION_VARIANTS[condition as keyof typeof EQUIPMENT_CONDITION_VARIANTS] ??
      'default'
    );
  }

  getOperationLabel(operation: string): string {
    return (
      MOVEMENT_OPERATION_LABELS[operation as keyof typeof MOVEMENT_OPERATION_LABELS] ?? operation
    );
  }

  getHistoryVariant(operation: string): BadgeVariant {
    return OPERATION_VARIANTS[operation] ?? 'default';
  }

  loadHistory(kitId: number): void {
    const op = this.historyFilter();
    this.historyService.getByKit(
      kitId,
      {
        page: this.historyPage(),
        pageSize: this.historyPageSize(),
      },
      { operation: op === 'all' ? null : op },
    );
  }

  /** Troca o filtro de operação e recarrega server-side (volta à página 1). */
  onHistoryFilterChange(value: MovementOperation | 'all'): void {
    this.historyFilter.set(value);
    this.historyPage.set(1);
    const id = this.kitId();
    if (id) this.loadHistory(id);
  }

  onHistoryPageChange(page: number): void {
    this.historyPage.set(page);
    const id = this.kitId();
    if (id) this.loadHistory(id);
  }

  onHistoryPageSizeChange(pageSize: number): void {
    this.historyPageSize.set(pageSize);
    this.historyPage.set(1);
    const id = this.kitId();
    if (id) this.loadHistory(id);
  }

  loadEquipment(kitId: number): void {
    this.equipmentService.getByKit(kitId, {
      page: this.equipmentPage(),
      pageSize: this.equipmentPageSize(),
    });
  }

  onEquipmentPageChange(page: number): void {
    this.equipmentPage.set(page);
    const id = this.kitId();
    if (id) this.loadEquipment(id);
  }

  onEquipmentPageSizeChange(pageSize: number): void {
    this.equipmentPageSize.set(pageSize);
    this.equipmentPage.set(1);
    const id = this.kitId();
    if (id) this.loadEquipment(id);
  }

  addEquipment(): void {
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
  }

  onEquipmentAssign(result: EquipmentBatchAssignResult): void {
    this.equipmentService
      .assignBatchToKit({ equipmentIds: result.equipmentIds, kitId: result.kitId })
      .subscribe({
        next: (response) => {
          if (response.failureCount === 0) {
            this.notificationService.success(
              `${response.successCount} equipamento${response.successCount > 1 ? 's' : ''} atribuído${response.successCount > 1 ? 's' : ''} ao kit.`,
            );
          } else if (response.successCount === 0) {
            // Motivo real do backend, traduzido (ex.: "Este kit já tem um ESP32").
            this.notificationService.error(
              this.assignFailureReason(response.errors) ??
                'Nenhum equipamento foi atribuído. Verifique se já não estão em uso.',
            );
          } else {
            const reason = this.assignFailureReason(response.errors);
            this.notificationService.warning(
              `${response.successCount} atribuído${response.successCount > 1 ? 's' : ''}, ${response.failureCount} falha${response.failureCount > 1 ? 's' : ''}.` +
                (reason ? ` (${reason})` : ''),
            );
          }
          this.closeAssignModal();
          const id = this.kitId();
          if (id) {
            this.loadKit(id);
          }
        },
        error: () => {
          this.notificationService.error('Erro ao atribuir equipamentos.');
        },
      });
  }

  /** Junta os motivos distintos (traduzidos) das falhas de atribuição em batch. */
  private assignFailureReason(errors: BatchAssignmentError[]): string | null {
    const reasons = [...new Set(errors.map((e) => translateBackendMessage(e.message)))];
    return reasons.length > 0 ? reasons.join(' ') : null;
  }

  openTransferModal(equipment: Equipment): void {
    this.selectedEquipmentForTransfer.set(equipment);
    this.isTransferModalOpen.set(true);
  }

  /** Ações do menu kebab de cada equipamento do kit. */
  equipmentActions(equipment: Equipment): ActionMenuItem[] {
    return [
      {
        label: 'Transferir',
        icon: 'transfer',
        action: () => {
          this.openTransferModal(equipment);
        },
      },
      {
        label: 'Remover',
        icon: 'delete',
        variant: 'destructive',
        action: () => {
          this.removeEquipment(equipment);
        },
      },
    ];
  }

  closeTransferModal(): void {
    this.isTransferModalOpen.set(false);
    this.selectedEquipmentForTransfer.set(null);
  }

  onEquipmentTransfer(result: EquipmentTransferResult): void {
    this.equipmentService
      .transfer(result.equipmentId, { toKitId: result.toKitId, notes: result.notes })
      .subscribe({
        next: () => {
          this.notificationService.success('Equipamento transferido.');
          this.closeTransferModal();
          const id = this.kitId();
          if (id) {
            this.loadKit(id);
          }
        },
        error: () => {
          this.notificationService.error('Erro ao transferir equipamento.');
        },
      });
  }

  removeEquipment(equipment: Equipment): void {
    this.equipmentService.removeFromKit(equipment.id).subscribe({
      next: () => {
        this.notificationService.success('Equipamento removido do kit.');
        const id = this.kitId();
        if (id) {
          this.loadEquipment(id);
          this.loadHistory(id);
        }
      },
      error: () => {
        this.notificationService.error('Erro ao remover equipamento.');
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/equipment/kits']);
  }

  openInstallModal(): void {
    this.isInstallModalOpen.set(true);
  }

  closeInstallModal(): void {
    this.isInstallModalOpen.set(false);
  }

  onKitInstall(result: KitInstallResult): void {
    this.kitService
      .installKit(result.kitId, {
        addressId: result.addressId,
        installationDate: result.installationDate,
        notes: result.notes,
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Kit instalado com sucesso.');
          this.closeInstallModal();
          this.loadKit(result.kitId);
        },
        error: () => {
          this.notificationService.error('Erro ao instalar kit.');
        },
      });
  }

  openRelocateModal(): void {
    this.isRelocateModalOpen.set(true);
  }

  closeRelocateModal(): void {
    this.isRelocateModalOpen.set(false);
  }

  onKitRelocate(result: KitRelocateResult): void {
    const kit = this.kitService.selectedKit();
    if (!kit) return;

    this.kitService
      .update(kit.id, {
        contractId: result.contractId,
        addressId: result.addressId,
        kitCode: kit.kitCode,
        installationDate: kit.installationDate,
        notes: result.notes ?? kit.notes ?? null,
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Kit migrado com sucesso.');
          this.closeRelocateModal();
          this.loadKit(kit.id);
        },
        error: () => {
          this.notificationService.error('Erro ao migrar kit.');
        },
      });
  }

  openUninstallModal(): void {
    this.isUninstallModalOpen.set(true);
  }

  closeUninstallModal(): void {
    this.isUninstallModalOpen.set(false);
  }

  onKitUninstall(result: KitUninstallResult): void {
    this.kitService
      .uninstallKit(result.kitId, {
        uninstallationDate: result.uninstallationDate,
        reason: result.reason,
        notes: result.notes,
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Kit desinstalado com sucesso.');
          this.closeUninstallModal();
          this.loadKit(result.kitId);
        },
        error: () => {
          this.notificationService.error('Erro ao desinstalar kit.');
        },
      });
  }

  openSwapEsp(): void {
    this.openSwapModal('esp');
  }

  openSwapSensor(): void {
    this.openSwapModal('sensor');
  }

  private openSwapModal(mode: SwapMode): void {
    this.swapMode.set(mode);
    this.swapCandidates.set([]);
    this.equipmentService.getUnassignedCandidates().subscribe({
      next: (list) => {
        this.swapCandidates.set(list);
      },
      error: () => {
        this.notificationService.error('Erro ao carregar equipamentos do estoque.');
      },
    });
    this.isSwapModalOpen.set(true);
  }

  closeSwapModal(): void {
    this.isSwapModalOpen.set(false);
  }

  onKitSwap(result: KitSwapResult): void {
    const id = this.kitId();
    if (id == null) return;

    const request$ =
      result.mode === 'esp'
        ? this.kitService.swapEsp(id, {
            newEspEquipmentId: result.newEspEquipmentId,
            retireOldEsp: result.retireOld,
          })
        : this.kitService.swapSensor(id, {
            oldSensorEquipmentId: result.oldSensorEquipmentId,
            newSensorEquipmentId: result.newSensorEquipmentId,
            retireOldSensor: result.retireOld,
          });

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          result.mode === 'esp' ? 'ESP trocado com sucesso.' : 'Sensor trocado com sucesso.',
        );
        this.closeSwapModal();
        this.loadKit(id);
      },
      // Erro exibido pelo errorInterceptor (mensagem traduzida); modal segue aberto.
      error: () => {},
    });
  }
}
