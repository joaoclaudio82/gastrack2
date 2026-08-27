import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { PermissionService } from '@core/auth/services/permission.service';
import { ApiService } from '@core/services/api.service';
import { DevicePingLogService } from '@core/services/device-ping-log.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { DevicePingLog } from '@models/device-ping-log.model';
import { UserRole } from '@models/role.model';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';

interface DashboardStats {
  activeCompanies: number;
  activeGasPoints: number;
  activeContracts: number;
  activeKits: number;
  totalEquipments: number;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    BadgeComponent,
    BreadcrumbComponent,
    CardComponent,
    RouterLink,
    StatCardComponent,
    TableLoadingStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full space-y-8">
      <app-breadcrumb />

      <header class="space-y-2">
        <h1 class="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Bem-vindo, {{ authService.displayName() }}!
        </h1>
        <p class="text-base text-muted-foreground">Aqui está o resumo das operações.</p>
      </header>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        role="list"
        aria-label="Métricas principais"
      >
        <!--
          Empresas só para quem opera mais de uma. Para o resto, a métrica da própria operação:
          o card antigo mostrava o literal "1" — a própria empresa, contada como se fosse notícia.
        -->
        @if (isSuperAdmin()) {
          <app-stat-card
            label="Empresas Ativas"
            [value]="stats()?.activeCompanies?.toString() ?? '-'"
            variant="info"
          >
            <svg
              stat-icon
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </app-stat-card>
        } @else {
          <app-stat-card
            label="Linhas de Gás"
            [value]="stats()?.activeGasPoints?.toString() ?? '-'"
            variant="info"
          >
            <svg
              stat-icon
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 4h16v6H4z" />
              <path d="M6 14h12v6H6z" />
              <path d="M10 14v-4h4v4" />
            </svg>
          </app-stat-card>
        }

        <app-stat-card
          label="Contratos Ativos"
          [value]="stats()?.activeContracts?.toString() ?? '-'"
          variant="success"
        >
          <svg
            stat-icon
            class="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </app-stat-card>

        <app-stat-card
          label="Kits Ativos"
          [value]="stats()?.activeKits?.toString() ?? '-'"
          variant="primary"
        >
          <svg
            stat-icon
            class="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </app-stat-card>

        <app-stat-card
          label="Equipamentos"
          [value]="stats()?.totalEquipments?.toString() ?? '-'"
          variant="warning"
        >
          <svg
            stat-icon
            class="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        </app-stat-card>
      </div>

      @if (isSuperAdmin()) {
        <app-card
          header="Últimos Device Pings"
          subheader="Dispositivos que consultaram credenciais recentemente"
        >
          @if (pingLogService.isLoading() && pingLogService.logs().length === 0) {
            <app-table-loading-state
              text="Carregando pings"
              hint="Buscando os registros mais recentes."
            />
          } @else if (pingLogService.logs().length === 0) {
            <p class="text-sm text-muted-foreground py-4">Nenhum ping registrado ainda.</p>
          } @else {
            <ul
              class="divide-y divide-border"
              role="list"
              aria-label="Últimos pings de dispositivos"
            >
              @for (log of pingLogService.logs(); track log.id) {
                <!-- Em retrato os dois blocos não cabem lado a lado: empilha até sm. -->
                <li
                  class="flex flex-col gap-1 py-3 px-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-sm font-mono font-medium text-foreground truncate">
                      {{ log.serialNumber }}
                    </span>
                    <span class="text-xs text-muted-foreground">{{ log.ipAddress || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    @if (log.hasEquipment) {
                      <app-badge variant="success">Cadastrado</app-badge>
                    } @else {
                      <button
                        class="cursor-pointer"
                        (click)="createEquipment(log)"
                        title="Clique para criar equipamento"
                      >
                        <app-badge variant="warning">+ Criar Equipamento</app-badge>
                      </button>
                    }
                    <span class="text-xs text-muted-foreground">
                      {{ formatPingDate(log.pingedAt) }}
                    </span>
                  </div>
                </li>
              }
            </ul>
            <div class="pt-3 border-t border-border">
              <a routerLink="/equipment/device-logs" class="text-sm text-primary hover:underline">
                Ver todos &rarr;
              </a>
            </div>
          }
        </app-card>
      }
    </div>
  `,
})
export class DashboardHomeComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  readonly pingLogService = inject(DevicePingLogService);
  private readonly permissionService = inject(PermissionService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly stats = signal<DashboardStats | null>(null);
  readonly isSuperAdmin = () => this.permissionService.hasAnyRole([UserRole.SUPER_ADMIN]);

  ngOnInit(): void {
    this.api.get<DashboardStats>('/dashboard/stats').subscribe({
      next: (data) => {
        this.stats.set(data);
      },
    });

    if (this.isSuperAdmin()) {
      this.pingLogService.getAll({
        page: 1,
        pageSize: 10,
        sortBy: 'pingedAt',
        sortOrder: 'desc',
      });
    }
  }

  createEquipment(log: DevicePingLog): void {
    void this.router.navigate(['/equipment/inventory'], {
      queryParams: { serialNumber: log.serialNumber, openForm: 'true' },
    });
  }

  formatPingDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  }
}
