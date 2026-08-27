import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { BadgeVariant } from '@models/badge.types';
import type { EquipmentKit, EquipmentKitRequest, KitStatus } from '@models/equipment-kit.model';
import { KIT_STATUS, KIT_STATUS_LABELS, KIT_STATUS_VARIANTS } from '@models/equipment-kit.model';
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
import { KitFormComponent } from '../../components/kit-form/kit-form.component';
import {
  KitRelocateModalComponent,
  type KitRelocateResult,
} from '../../components/kit-relocate-modal/kit-relocate-modal.component';

@Component({
  selector: 'app-kits',
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
    KitFormComponent,
    KitRelocateModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-foreground">Kits de Equipamentos</h1>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            @if (contractIdFilter()) {
              Kits do contrato selecionado
            } @else {
              Gerencie os kits de equipamentos
            }
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
            Novo Kit
          </app-button>
        }
      </div>

      <!-- Contract Filter Banner -->
      @if (contractIdFilter()) {
        <div
          class="flex items-center justify-between gap-2 p-3 rounded-sm bg-primary/10 border border-primary/20"
        >
          <span class="text-sm text-foreground">
            <span class="font-medium">Filtrando por contrato</span>
            @if (contractCompanyName()) {
              <span class="text-muted-foreground">— Empresa: {{ contractCompanyName() }}</span>
            }
          </span>
          <app-button variant="outline" size="sm" (buttonClick)="clearContractFilter()">
            Ver todos os kits
          </app-button>
        </div>
      }

      <!-- Tabs: Instalados vs Não-instalados -->
      <div class="flex gap-2 border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === 'installed'"
          class="px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors"
          [class.border-primary]="activeTab() === 'installed'"
          [class.text-foreground]="activeTab() === 'installed'"
          [class.border-transparent]="activeTab() !== 'installed'"
          [class.text-muted-foreground]="activeTab() !== 'installed'"
          (click)="setTab('installed')"
        >
          Instalados ({{ installedCount() }})
        </button>
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === 'notInstalled'"
          class="px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors"
          [class.border-primary]="activeTab() === 'notInstalled'"
          [class.text-foreground]="activeTab() === 'notInstalled'"
          [class.border-transparent]="activeTab() !== 'notInstalled'"
          [class.text-muted-foreground]="activeTab() !== 'notInstalled'"
          (click)="setTab('notInstalled')"
        >
          Não-instalados ({{ notInstalledCount() }})
        </button>
      </div>

      @if (kitService.isLoading() && kitService.kits().length === 0) {
        <app-table-loading-state
          text="Carregando kits"
          hint="Buscando kits vinculados aos contratos."
        />
      } @else if (kitService.kits().length === 0) {
        <app-empty-state
          title="Nenhum kit encontrado"
          description="Não há kits cadastrados no sistema."
          [action]="isSuperAdmin() ? 'Cadastrar Kit' : ''"
          (actionClick)="openForm()"
        />
      } @else {
        <app-data-table>
          <ng-container data-table-head>
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Código
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
                Contrato
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Endereço
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Equipamentos
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Instalação
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Ações
              </th>
            </tr>
          </ng-container>

          <ng-container data-table-body>
            @for (kit of kitService.kits(); track kit.id) {
              <tr class="cursor-pointer" (click)="viewDetail(kit)">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-foreground">{{ kit.kitCode }}</span>
                </td>
                @if (isSuperAdmin()) {
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-muted-foreground">{{ kit.companyName }}</span>
                  </td>
                }
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ kit.contractNumber }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ kit.addressName }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">{{ kit.equipmentCount }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-muted-foreground">
                    {{ kit.installationDate ? (kit.installationDate | date: 'dd/MM/yyyy') : '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-badge [variant]="getStatusVariant(kit.status)">
                    {{ getStatusLabel(kit.status) }}
                  </app-badge>
                </td>
                <td class="px-3 sm:px-6 py-4 cursor-default">
                  <div class="flex justify-end">
                    <app-action-menu [items]="rowActions(kit)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="kitService.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-kit-form
      [isOpen]="isFormOpen()"
      [kit]="selectedKit()"
      [preselectedCompanyId]="contractCompanyId()"
      [preselectedCompanyName]="contractCompanyName()"
      [isLoading]="kitService.isLoading()"
      (submitted)="onFormSubmit($event)"
      (closed)="closeForm()"
    />

    <app-kit-relocate-modal
      [isOpen]="isRelocateModalOpen()"
      [kit]="selectedKitForRelocate()"
      [isLoading]="kitService.isLoading()"
      (submitted)="onKitRelocate($event)"
      (closed)="closeRelocateModal()"
    />
  `,
})
export class KitsComponent implements OnInit {
  readonly kitService = inject(EquipmentKitService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isFormOpen = signal(false);
  readonly isRelocateModalOpen = signal(false);
  readonly selectedKit = signal<EquipmentKit | null>(null);
  readonly selectedKitForRelocate = signal<EquipmentKit | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly activeTab = signal<'installed' | 'notInstalled'>('installed');
  readonly installedCount = signal(0);
  readonly notInstalledCount = signal(0);
  readonly contractIdFilter = signal<number | null>(null);
  readonly contractCompanyId = signal<number | null>(null);
  readonly contractCompanyName = signal<string | null>(null);

  // ponytail: aba "Não-instalados" = PENDING (REMOVED fica de fora; adicionar se o produto pedir)
  private tabStatus(): KitStatus {
    return this.activeTab() === 'installed' ? KIT_STATUS.INSTALLED : KIT_STATUS.PENDING;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const contractId = params['contractId'];
      const companyId = params['companyId'];
      const companyName = params['companyName'];

      // Os sinais espelham a URL, inclusive quando o parâmetro some. Antes só
      // havia o caminho de setar: como o Angular reaproveita o componente na
      // mesma rota, entrar em /kits sem parâmetro mantinha o filtro do contrato
      // anterior, e não havia como voltar para a listagem completa.
      this.contractIdFilter.set(contractId ? Number(contractId) : null);
      this.contractCompanyId.set(companyId ? Number(companyId) : null);
      this.contractCompanyName.set(companyName ?? null);
      this.currentPage.set(1);
      this.loadKits();
    });
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  loadKits(): void {
    this.kitService.getAll(
      {
        page: this.currentPage(),
        pageSize: this.pageSize(),
      },
      {
        status: this.tabStatus(),
        contractId: this.contractIdFilter(),
      },
    );
    this.refreshCounts();
  }

  private refreshCounts(): void {
    const contractId = this.contractIdFilter();
    this.kitService.getCountByStatus(KIT_STATUS.INSTALLED, contractId).subscribe((count) => {
      this.installedCount.set(count);
    });
    this.kitService.getCountByStatus(KIT_STATUS.PENDING, contractId).subscribe((count) => {
      this.notInstalledCount.set(count);
    });
  }

  setTab(tab: 'installed' | 'notInstalled'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadKits();
  }

  /** Só tira os parâmetros da URL; quem reage é a subscription de queryParams. */
  clearContractFilter(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  getStatusLabel(status: string): string {
    return KIT_STATUS_LABELS[status as keyof typeof KIT_STATUS_LABELS] ?? status;
  }

  getStatusVariant(status: string): BadgeVariant {
    return KIT_STATUS_VARIANTS[status as keyof typeof KIT_STATUS_VARIANTS] ?? 'default';
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadKits();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadKits();
  }

  openForm(): void {
    this.selectedKit.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedKit.set(null);
  }

  editKit(kit: EquipmentKit): void {
    this.selectedKit.set(kit);
    this.isFormOpen.set(true);
  }

  openRelocateModal(kit: EquipmentKit): void {
    this.selectedKitForRelocate.set(kit);
    this.isRelocateModalOpen.set(true);
  }

  closeRelocateModal(): void {
    this.isRelocateModalOpen.set(false);
    this.selectedKitForRelocate.set(null);
  }

  onKitRelocate(result: KitRelocateResult): void {
    const kit = this.selectedKitForRelocate();
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
          this.loadKits();
        },
        // Mensagem de erro é exibida (e traduzida) pelo errorInterceptor; mantém o
        // modal aberto para o usuário corrigir e tentar de novo.
        error: () => {},
      });
  }

  viewDetail(kit: EquipmentKit): void {
    void this.router.navigate(['/equipment/kits', kit.id]);
  }

  /** Ações do menu kebab da linha. "Ver detalhes" também está no clique da linha. */
  rowActions(kit: EquipmentKit): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        label: 'Ver detalhes',
        icon: 'view',
        action: () => {
          this.viewDetail(kit);
        },
      },
    ];
    if (this.isSuperAdmin()) {
      items.push(
        {
          label: 'Migrar',
          icon: 'transfer',
          action: () => {
            this.openRelocateModal(kit);
          },
        },
        {
          label: 'Editar',
          icon: 'edit',
          action: () => {
            this.editKit(kit);
          },
        },
      );
    }
    return items;
  }

  onFormSubmit(data: EquipmentKitRequest): void {
    const selected = this.selectedKit();
    if (selected) {
      this.kitService.update(selected.id, data).subscribe({
        next: () => {
          this.notificationService.success('Kit atualizado com sucesso!');
          this.closeForm();
          this.loadKits();
        },
        // Erro exibido pelo errorInterceptor (mensagem traduzida).
        error: () => {},
      });
    } else {
      this.kitService.create(data).subscribe({
        next: () => {
          this.notificationService.success('Kit criado com sucesso!');
          this.closeForm();
          this.loadKits();
        },
        // Erro exibido pelo errorInterceptor (mensagem traduzida).
        error: () => {},
      });
    }
  }
}
