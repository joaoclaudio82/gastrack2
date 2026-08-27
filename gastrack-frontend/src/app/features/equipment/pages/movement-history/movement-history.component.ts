import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { MovementHistoryService } from '@core/services/movement-history.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { MovementHistory, MovementOperation } from '@models/movement-history.model';
import {
  isEquipmentOperation,
  isKitOperation,
  MOVEMENT_OPERATION,
  MOVEMENT_OPERATION_LABELS,
} from '@models/movement-history.model';
import { UserRole } from '@models/role.model';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';
import {
  TimelineComponent,
  type TimelineIcon,
  type TimelineItem,
  type TimelineVariant,
} from '@shared/components/ui/timeline/timeline.component';

type ViewMode = 'table' | 'timeline';
type FilterType = 'all' | 'equipment' | 'kit';

// Map operations to timeline icons
const OPERATION_ICONS: Record<string, TimelineIcon> = {
  [MOVEMENT_OPERATION.CREATED]: 'plus',
  [MOVEMENT_OPERATION.ASSIGNED_TO_KIT]: 'link',
  [MOVEMENT_OPERATION.REMOVED_FROM_KIT]: 'unlink',
  [MOVEMENT_OPERATION.TRANSFERRED]: 'transfer',
  [MOVEMENT_OPERATION.CONDITION_CHANGED]: 'settings',
  [MOVEMENT_OPERATION.DEACTIVATED]: 'x',
  [MOVEMENT_OPERATION.REACTIVATED]: 'check',
  [MOVEMENT_OPERATION.KIT_CREATED]: 'package',
  [MOVEMENT_OPERATION.KIT_INSTALLED]: 'check',
  [MOVEMENT_OPERATION.KIT_MAINTENANCE_START]: 'wrench',
  [MOVEMENT_OPERATION.KIT_MAINTENANCE_END]: 'check',
  [MOVEMENT_OPERATION.KIT_REMOVED]: 'trash',
  [MOVEMENT_OPERATION.KIT_DECOMMISSIONED]: 'trash',
};

// Map operations to timeline variants
const OPERATION_VARIANTS: Record<string, TimelineVariant> = {
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
  selector: 'app-movement-history',
  standalone: true,
  imports: [
    DatePipe,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    TimelineComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-foreground">Histórico de Movimentações</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Visualize todas as movimentações de equipamentos e kits
          </p>
        </div>
        <div
          class="flex flex-col gap-3 w-full lg:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end shrink-0"
        >
          <!-- View Mode Toggle -->
          <div
            class="flex items-center gap-1 p-1 bg-muted rounded-sm self-start sm:self-auto"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="viewMode() === 'table'"
              class="p-2 rounded transition-colors"
              [class.bg-background]="viewMode() === 'table'"
              [class.shadow-sm]="viewMode() === 'table'"
              (click)="setViewMode('table')"
              (keydown.enter)="setViewMode('table')"
              (keydown.space)="setViewMode('table')"
              aria-label="Visualização em tabela"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="viewMode() === 'timeline'"
              class="p-2 rounded transition-colors"
              [class.bg-background]="viewMode() === 'timeline'"
              [class.shadow-sm]="viewMode() === 'timeline'"
              (click)="setViewMode('timeline')"
              (keydown.enter)="setViewMode('timeline')"
              (keydown.space)="setViewMode('timeline')"
              aria-label="Visualização em timeline"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
          </div>

          <!-- Filter Buttons -->
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <app-button
              [variant]="filter() === 'all' ? 'primary' : 'outline'"
              size="sm"
              class="flex-1 min-w-[120px] sm:flex-none"
              (buttonClick)="setFilter('all')"
            >
              Todos
            </app-button>
            <app-button
              [variant]="filter() === 'equipment' ? 'primary' : 'outline'"
              size="sm"
              class="flex-1 min-w-[120px] sm:flex-none"
              (buttonClick)="setFilter('equipment')"
            >
              Equipamentos
            </app-button>
            <app-button
              [variant]="filter() === 'kit' ? 'primary' : 'outline'"
              size="sm"
              class="flex-1 min-w-[120px] sm:flex-none"
              (buttonClick)="setFilter('kit')"
            >
              Kits
            </app-button>
          </div>
        </div>
      </div>

      @if (historyService.isLoading() && historyService.history().length === 0) {
        <app-table-loading-state
          text="Carregando movimentações"
          hint="Buscando o histórico de eventos."
        />
      } @else if (historyService.history().length === 0) {
        <app-empty-state
          title="Nenhuma movimentação encontrada"
          description="Não há movimentações registradas no sistema."
        />
      } @else if (viewMode() === 'timeline') {
        <!-- Timeline View -->
        <div class="bg-card rounded-sm border border-border p-6 shadow-sm">
          <app-timeline [items]="timelineItems()" emptyMessage="Nenhuma movimentação registrada" />
        </div>

        <!-- Pagination for Timeline -->
        <app-data-table-footer
          [pagination]="historyService.pagination()"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        />
      } @else {
        <!-- Table View -->
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Data/Hora
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Operação
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Equipamento
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Kit
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                De/Para
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Usuário
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Observações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (entry of filteredHistory(); track entry.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ entry.operationAt | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    @if (isKitOp(entry.operation)) {
                      <app-badge variant="info">Kit</app-badge>
                    } @else {
                      <app-badge variant="primary">Equip.</app-badge>
                    }
                    <span class="text-sm font-medium">
                      {{ getOperationLabel(entry.operation) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ entry.equipmentAssetTag || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ entry.kitCode || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (entry.fromKitCode || entry.toKitCode) {
                    <span class="text-sm text-muted-foreground">
                      {{ entry.fromKitCode || '-' }} → {{ entry.toKitCode || '-' }}
                    </span>
                  } @else {
                    <span class="text-sm text-muted-foreground">-</span>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ entry.userName }}</span>
                </td>
                <!-- line-clamp-1 sozinho engolia observações longas sem dar como lê-las. -->
                <td class="px-6 py-4 max-w-xs">
                  <span
                    class="text-sm text-muted-foreground line-clamp-2 break-words"
                    [title]="entry.notes || ''"
                  >
                    {{ entry.notes || '-' }}
                  </span>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="historyService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>
  `,
})
export class MovementHistoryComponent implements OnInit {
  readonly historyService = inject(MovementHistoryService);
  private readonly authService = inject(AuthService);

  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly filter = signal<FilterType>('all');
  readonly viewMode = signal<ViewMode>('table');

  readonly filteredHistory = (): MovementHistory[] => {
    const history = this.historyService.history();
    const currentFilter = this.filter();

    if (currentFilter === 'all') return history;
    if (currentFilter === 'equipment')
      return history.filter((h) => isEquipmentOperation(h.operation));
    if (currentFilter === 'kit') return history.filter((h) => isKitOperation(h.operation));
    return history;
  };

  // Transform history entries to timeline items
  readonly timelineItems = computed<TimelineItem[]>(() => {
    return this.filteredHistory().map((entry) => this.mapToTimelineItem(entry));
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  loadHistory(): void {
    this.historyService.getAll({
      page: this.currentPage(),
      pageSize: this.pageSize(),
    });
  }

  getOperationLabel(operation: string): string {
    return (
      MOVEMENT_OPERATION_LABELS[operation as keyof typeof MOVEMENT_OPERATION_LABELS] ?? operation
    );
  }

  isKitOp(operation: string): boolean {
    return isKitOperation(operation as MovementOperation);
  }

  setFilter(filter: FilterType): void {
    this.filter.set(filter);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadHistory();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadHistory();
  }

  private mapToTimelineItem(entry: MovementHistory): TimelineItem {
    const operation = entry.operation;
    const label = this.getOperationLabel(operation);
    const isKitOp = isKitOperation(operation);

    // Build description
    let description = '';
    if (isKitOp) {
      description = entry.kitCode ? `Kit: ${entry.kitCode}` : '';
    } else {
      description = entry.equipmentAssetTag ? `Equipamento: ${entry.equipmentAssetTag}` : '';
      if (entry.kitCode) {
        description += description ? ` | Kit: ${entry.kitCode}` : `Kit: ${entry.kitCode}`;
      }
    }

    // Build metadata
    const metadata: Record<string, string> = {};
    if (entry.userName) {
      metadata['Usuário'] = entry.userName;
    }
    if (entry.fromKitCode && entry.toKitCode) {
      metadata['De'] = entry.fromKitCode;
      metadata['Para'] = entry.toKitCode;
    } else if (entry.toKitCode) {
      metadata['Para'] = entry.toKitCode;
    }

    return {
      id: entry.id,
      title: label,
      description: description !== '' ? description : (entry.notes ?? undefined),
      date: entry.operationAt,
      icon: OPERATION_ICONS[operation] ?? 'plus',
      variant: OPERATION_VARIANTS[operation] ?? 'default',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  }
}
