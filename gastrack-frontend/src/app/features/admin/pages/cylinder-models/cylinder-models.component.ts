import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { CylinderModelService } from '@core/services/cylinder-model.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { PaginationParams } from '@models/api-response.model';
import {
  GAS_TYPE_LABELS,
  type CylinderModel,
  type CylinderModelRequest,
} from '@models/cylinder-model.model';
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
import { CylinderModelFormComponent } from '../../components/cylinder-model-form/cylinder-model-form.component';

@Component({
  selector: 'app-cylinder-models',
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
    CylinderModelFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Catálogo de Modelos de Cilindro</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Tipos de cilindro (gás, volume e pressão) reutilizados no cadastro de botijões.
          </p>
        </div>
        <app-button
          variant="primary"
          class="flex-shrink-0 whitespace-nowrap"
          (buttonClick)="openForm()"
        >
          Novo Modelo
        </app-button>
      </div>

      @if (service.isLoading() && service.models().length === 0) {
        <app-table-loading-state text="Carregando modelos" hint="Buscando o catálogo." />
      } @else if (service.models().length === 0) {
        <app-empty-state
          title="Nenhum modelo cadastrado"
          description="Cadastre o primeiro modelo de cilindro do catálogo."
          action="Novo Modelo"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Tipo de gás
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Volume (L)
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Pressão (bar)
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
            @for (model of service.models(); track model.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-foreground">
                  {{ model.codigo }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {{ gasLabel(model) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {{ model.waterVolumeLiters }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {{ model.capacityBar }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (model.active) {
                    <app-badge variant="success">Ativo</app-badge>
                  } @else {
                    <app-badge variant="default">Inativo</app-badge>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex justify-start">
                    <app-action-menu [items]="rowActions(model)" />
                  </div>
                </td>
              </tr>
            }
          </ng-container>

          <app-data-table-footer
            data-table-footer
            [pagination]="service.pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </app-data-table>
      }
    </div>

    <app-cylinder-model-form
      [isOpen]="isFormOpen()"
      [model]="selected()"
      [isLoading]="service.isLoading()"
      (submitted)="onSubmit($event)"
      (closed)="closeForm()"
    />
  `,
})
export class CylinderModelsComponent implements OnInit {
  readonly service = inject(CylinderModelService);
  private readonly notification = inject(NotificationService);

  readonly isFormOpen = signal(false);
  readonly selected = signal<CylinderModel | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    this.load();
  }

  gasLabel(model: CylinderModel): string {
    return GAS_TYPE_LABELS[model.gasType] ?? model.gasType;
  }

  load(): void {
    const params: PaginationParams = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: 'codigo',
      sortOrder: 'asc',
    };
    this.service.getAll(params);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.load();
  }

  openForm(): void {
    this.selected.set(null);
    this.isFormOpen.set(true);
  }

  rowActions(model: CylinderModel): ActionMenuItem[] {
    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.edit(model);
        },
      },
      {
        label: 'Excluir',
        icon: 'delete',
        variant: 'destructive',
        action: () => {
          this.remove(model);
        },
      },
    ];
  }

  edit(model: CylinderModel): void {
    this.selected.set(model);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selected.set(null);
  }

  onSubmit(request: CylinderModelRequest): void {
    const current = this.selected();
    const op = current ? this.service.update(current.id, request) : this.service.create(request);
    op.subscribe({
      next: () => {
        this.notification.success(
          current ? 'Modelo atualizado com sucesso!' : 'Modelo criado com sucesso!',
        );
        this.closeForm();
        this.load();
      },
      error: () => {
        this.notification.error('Erro ao salvar o modelo de cilindro.');
      },
    });
  }

  remove(model: CylinderModel): void {
    if (!confirm(`Excluir o modelo "${model.codigo}"?`)) return;
    this.service.delete(model.id).subscribe({
      next: () => {
        this.notification.success('Modelo excluído com sucesso!');
        this.load();
      },
      error: () => {
        this.notification.error('Erro ao excluir o modelo de cilindro.');
      },
    });
  }
}
