import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { DevicePingLogService } from '@core/services/device-ping-log.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { DevicePingLog } from '@models/device-ping-log.model';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SwitchComponent } from '@shared/components/ui/switch/switch.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';

@Component({
  selector: 'app-device-ping-logs',
  standalone: true,
  imports: [
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    InputComponent,
    SwitchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-foreground">Logs de Ping</h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            Dispositivos que consultaram credenciais no sistema
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3">
        <app-input
          class="w-full sm:w-64"
          type="search"
          placeholder="Buscar por serial..."
          size="sm"
          [ngModel]="serialFilter()"
          (ngModelChange)="onSerialFilterChange($event)"
        />

        <div class="flex items-center gap-2 sm:pt-1.5">
          <app-switch
            size="sm"
            [ngModel]="unregisteredFilter()"
            (ngModelChange)="onUnregisteredFilterChange($event)"
          />
          <span class="text-sm text-muted-foreground">Apenas não cadastrados</span>
        </div>

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

      @if (pingLogService.isLoading() && pingLogService.logs().length === 0) {
        <app-table-loading-state
          text="Carregando logs"
          hint="Estamos buscando os registros de ping."
        />
      } @else if (pingLogService.logs().length === 0) {
        <app-empty-state
          title="Nenhum log de ping encontrado"
          description="Nenhum dispositivo consultou credenciais ainda."
        />
      } @else {
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
                IP
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Equipamento
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Data/Hora
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Ações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (log of pingLogService.logs(); track log.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-mono font-medium text-foreground">
                    {{ log.serialNumber }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ log.ipAddress || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (log.hasEquipment) {
                    <app-badge variant="success">{{ log.equipmentAssetTag }}</app-badge>
                  } @else {
                    <app-badge variant="warning">Não cadastrado</app-badge>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ formatDate(log.pingedAt) }}
                  </span>
                </td>
                <td class="px-3 sm:px-6 py-4">
                  @if (!log.hasEquipment) {
                    <app-button
                      variant="outline"
                      size="sm"
                      (buttonClick)="createEquipment(log)"
                      class="w-full sm:w-auto min-h-[44px] sm:min-h-0"
                    >
                      Criar Equipamento
                    </app-button>
                  }
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="pingLogService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>
  `,
})
export class DevicePingLogsComponent implements OnInit {
  readonly pingLogService = inject(DevicePingLogService);
  private readonly router = inject(Router);

  // Pagination
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  // Filters
  readonly serialFilter = signal<string>('');
  readonly unregisteredFilter = signal<boolean>(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly hasActiveFilters = computed(
    () => this.serialFilter() !== '' || this.unregisteredFilter(),
  );

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.pingLogService.getAll(
      {
        page: this.currentPage(),
        pageSize: this.pageSize(),
        sortBy: 'pingedAt',
        sortOrder: 'desc',
      },
      {
        serial: this.serialFilter() || null,
        unregistered: this.unregisteredFilter(),
      },
    );
  }

  onSerialFilterChange(value: string): void {
    this.serialFilter.set(value);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadLogs();
    }, 300);
  }

  onUnregisteredFilterChange(value: boolean): void {
    this.unregisteredFilter.set(value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.serialFilter.set('');
    this.unregisteredFilter.set(false);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadLogs();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadLogs();
  }

  createEquipment(log: DevicePingLog): void {
    void this.router.navigate(['/equipment/inventory'], {
      queryParams: { serialNumber: log.serialNumber, openForm: 'true' },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
