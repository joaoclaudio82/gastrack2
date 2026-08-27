import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import { EquipmentTypeService } from '@core/services/equipment-type.service';
import { EquipmentService } from '@core/services/equipment.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { BadgeVariant } from '@models/badge.types';
import type { Equipment, EquipmentCondition, EquipmentRequest } from '@models/equipment.model';
import {
  EQUIPMENT_CONDITION,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_CONDITION_VARIANTS,
  isEquipmentAssigned,
} from '@models/equipment.model';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '@shared/components/ui/action-menu/action-menu.component';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import {
  ComboboxComponent,
  type ComboboxOption,
} from '@shared/components/ui/combobox/combobox.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';
import { EquipmentFormComponent } from '../../components/equipment-form/equipment-form.component';
import {
  EquipmentKitAssignModalComponent,
  type EquipmentKitAssignResult,
} from '../../components/equipment-kit-assign-modal/equipment-kit-assign-modal.component';

type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    FormsModule,
    ActionMenuComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    ComboboxComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    SelectComponent,
    EquipmentFormComponent,
    EquipmentKitAssignModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-foreground">Inventário de Equipamentos</h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie todos os equipamentos do sistema
          </p>
        </div>
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
          Novo Equipamento
        </app-button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3">
        <!-- Assignment Status Filter -->
        <div class="flex flex-wrap gap-2 sm:pt-1">
          <app-button
            [variant]="assignmentFilter() === 'all' ? 'primary' : 'outline'"
            size="sm"
            (buttonClick)="setAssignmentFilter('all')"
            class="flex-1 sm:flex-none min-w-[80px]"
          >
            Todos
          </app-button>
          <app-button
            [variant]="assignmentFilter() === 'assigned' ? 'primary' : 'outline'"
            size="sm"
            (buttonClick)="setAssignmentFilter('assigned')"
            class="flex-1 sm:flex-none min-w-[80px]"
          >
            Alocados
          </app-button>
          <app-button
            [variant]="assignmentFilter() === 'unassigned' ? 'primary' : 'outline'"
            size="sm"
            (buttonClick)="setAssignmentFilter('unassigned')"
            class="flex-1 sm:flex-none min-w-[80px]"
          >
            Em Estoque
          </app-button>
        </div>

        <!-- Condition Filter -->
        <app-select
          class="w-full sm:w-44"
          placeholder="Todas Condições"
          [options]="conditionOptions"
          [ngModel]="conditionFilter()"
          (ngModelChange)="setConditionFilter($event)"
          [clearable]="true"
          [compact]="true"
          size="sm"
        />

        <!-- Equipment Type Filter -->
        <app-select
          class="w-full sm:w-44"
          placeholder="Todos os Tipos"
          [options]="typeOptions()"
          [ngModel]="typeFilter()"
          (ngModelChange)="setTypeFilter($event)"
          [clearable]="true"
          [compact]="true"
          size="sm"
        />

        <!-- Kit Filter -->
        <app-combobox
          class="w-full sm:w-52"
          placeholder="Buscar kit..."
          [options]="kitComboboxOptions()"
          [ngModel]="kitFilter()"
          (ngModelChange)="setKitFilter($event)"
          [clearable]="true"
          size="sm"
          emptyMessage="Nenhum kit encontrado"
        />

        @if (hasActiveFilters()) {
          <app-button
            variant="outline"
            size="sm"
            (buttonClick)="clearFilters()"
            class="w-full sm:w-auto"
          >
            Limpar Filtros
          </app-button>
        }
      </div>

      @if (equipmentService.isLoading() && filteredEquipments().length === 0) {
        <app-table-loading-state
          text="Carregando equipamentos"
          hint="Estamos buscando os equipamentos cadastrados."
        />
      } @else if (filteredEquipments().length === 0) {
        <app-empty-state
          title="Nenhum equipamento encontrado"
          description="Cadastre o primeiro equipamento do sistema."
          action="Cadastrar Equipamento"
          (actionClick)="openForm()"
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
                Kit
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Empresa
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Condição
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
            @for (equipment of filteredEquipments(); track equipment.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">{{ equipment.assetTag }}</span>
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
                  <span class="text-sm text-muted-foreground">{{ equipment.kitCode || '-' }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ equipment.companyName || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-badge [variant]="getConditionVariant(equipment.condition)">
                    {{ getConditionLabel(equipment.condition) }}
                  </app-badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (isAssigned(equipment)) {
                    <app-badge variant="success">Alocado</app-badge>
                  } @else {
                    <app-badge variant="default">Estoque</app-badge>
                  }
                </td>
                <td class="px-3 sm:px-6 py-4">
                  <div class="flex justify-start">
                    <app-action-menu [items]="rowActions(equipment)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="equipmentService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-equipment-form
      [isOpen]="isFormOpen()"
      [equipment]="selectedEquipment()"
      [defaultSerialNumber]="defaultSerialNumber()"
      [isLoading]="equipmentService.isLoading()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />

    <app-equipment-kit-assign-modal
      [isOpen]="isAssignModalOpen()"
      [equipment]="selectedEquipmentForAssign()"
      [isLoading]="equipmentService.isLoading()"
      (submitted)="onAssignSubmit($event)"
      (closed)="closeAssignModal()"
    />
  `,
})
export class EquipmentListComponent implements OnInit {
  readonly equipmentService = inject(EquipmentService);
  readonly equipmentTypeService = inject(EquipmentTypeService);
  private readonly equipmentKitService = inject(EquipmentKitService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  // Form state
  readonly isFormOpen = signal(false);
  readonly selectedEquipment = signal<Equipment | null>(null);
  readonly defaultSerialNumber = signal<string | null>(null);

  // Assign modal state
  readonly isAssignModalOpen = signal(false);
  readonly selectedEquipmentForAssign = signal<Equipment | null>(null);

  // Pagination
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  // Filters
  readonly assignmentFilter = signal<AssignmentFilter>('all');
  readonly conditionFilter = signal<EquipmentCondition | null>(null);
  readonly typeFilter = signal<number | null>(null);
  readonly kitFilter = signal<number | null>(null);

  // Condition options for dropdown
  readonly conditionOptions: SelectOption[] = [
    { label: EQUIPMENT_CONDITION_LABELS.NEW, value: EQUIPMENT_CONDITION.NEW },
    { label: EQUIPMENT_CONDITION_LABELS.GOOD, value: EQUIPMENT_CONDITION.GOOD },
    { label: EQUIPMENT_CONDITION_LABELS.FAIR, value: EQUIPMENT_CONDITION.FAIR },
    { label: EQUIPMENT_CONDITION_LABELS.POOR, value: EQUIPMENT_CONDITION.POOR },
    { label: EQUIPMENT_CONDITION_LABELS.DAMAGED, value: EQUIPMENT_CONDITION.DAMAGED },
    { label: EQUIPMENT_CONDITION_LABELS.RETIRED, value: EQUIPMENT_CONDITION.RETIRED },
  ];

  // Type options computed from service
  readonly typeOptions = computed<SelectOption[]>(() => {
    const types = this.equipmentTypeService.activeTypes();
    return types.map((t) => ({ label: t.name, value: t.id }));
  });

  // Kit options computed from service (for combobox autocomplete)
  readonly kitComboboxOptions = computed<ComboboxOption[]>(() =>
    this.equipmentKitService.kitOptions().map((k) => ({
      label: k.label,
      value: k.value,
    })),
  );

  // Equipments are already filtered server-side
  readonly filteredEquipments = computed(() => this.equipmentService.equipments());

  ngOnInit(): void {
    this.loadEquipments();
    this.equipmentTypeService.getActive();
    this.equipmentKitService.getAll({ page: 1, pageSize: 200 });

    const params = this.route.snapshot.queryParams;
    if (params['openForm'] === 'true') {
      const serial = params['serialNumber'] ?? null;
      this.defaultSerialNumber.set(serial);
      this.openForm();
    }
  }

  loadEquipments(): void {
    this.equipmentService.getAll(
      {
        page: this.currentPage(),
        pageSize: this.pageSize(),
      },
      {
        assignment: this.assignmentFilter(),
        condition: this.conditionFilter(),
        typeId: this.typeFilter(),
        kitId: this.kitFilter(),
      },
    );
  }

  // Filter methods
  setAssignmentFilter(filter: AssignmentFilter): void {
    this.assignmentFilter.set(filter);
    this.currentPage.set(1);
    this.loadEquipments();
  }

  setConditionFilter(condition: EquipmentCondition | null): void {
    this.conditionFilter.set(condition);
    this.currentPage.set(1);
    this.loadEquipments();
  }

  setTypeFilter(typeId: number | null): void {
    this.typeFilter.set(typeId);
    this.currentPage.set(1);
    this.loadEquipments();
  }

  setKitFilter(kitId: number | null): void {
    this.kitFilter.set(kitId);
    this.currentPage.set(1);
    this.loadEquipments();
  }

  hasActiveFilters(): boolean {
    return (
      this.assignmentFilter() !== 'all' ||
      this.conditionFilter() !== null ||
      this.typeFilter() !== null ||
      this.kitFilter() !== null
    );
  }

  clearFilters(): void {
    this.assignmentFilter.set('all');
    this.conditionFilter.set(null);
    this.typeFilter.set(null);
    this.kitFilter.set(null);
    this.currentPage.set(1);
    this.loadEquipments();
  }

  isAssigned(equipment: Equipment): boolean {
    return isEquipmentAssigned(equipment);
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEquipments();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadEquipments();
  }

  // Form methods
  openForm(): void {
    this.selectedEquipment.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedEquipment.set(null);
    this.defaultSerialNumber.set(null);
  }

  rowActions(equipment: Equipment): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.editEquipment(equipment);
        },
      },
    ];

    if (!this.isAssigned(equipment)) {
      items.push({
        label: 'Atribuir',
        icon: 'transfer',
        action: () => {
          this.openAssignModal(equipment);
        },
      });
    }

    return items;
  }

  editEquipment(equipment: Equipment): void {
    this.selectedEquipment.set(equipment);
    this.isFormOpen.set(true);
  }

  onFormSubmit(data: EquipmentRequest): void {
    const selected = this.selectedEquipment();
    if (selected) {
      this.equipmentService.update(selected.id, data).subscribe({
        next: () => {
          this.notificationService.success('Equipamento atualizado com sucesso!');
          this.closeForm();
          this.loadEquipments();
        },
        error: () => {
          this.notificationService.error('Erro ao atualizar equipamento.');
        },
      });
    } else {
      this.equipmentService.create(data).subscribe({
        next: () => {
          this.notificationService.success('Equipamento criado com sucesso!');
          this.closeForm();
          this.loadEquipments();
        },
        error: () => {
          this.notificationService.error('Erro ao criar equipamento.');
        },
      });
    }
  }

  // Assign modal methods
  openAssignModal(equipment: Equipment): void {
    this.selectedEquipmentForAssign.set(equipment);
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
    this.selectedEquipmentForAssign.set(null);
  }

  onAssignSubmit(result: EquipmentKitAssignResult): void {
    this.equipmentService.assignToKit(result.equipmentId, { kitId: result.kitId }).subscribe({
      next: () => {
        this.notificationService.success('Equipamento atribuído ao kit com sucesso!');
        this.closeAssignModal();
        this.loadEquipments();
      },
      error: () => {
        this.notificationService.error('Erro ao atribuir equipamento.');
      },
    });
  }
}
