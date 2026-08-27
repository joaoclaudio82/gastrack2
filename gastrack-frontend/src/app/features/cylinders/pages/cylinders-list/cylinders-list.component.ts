import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';
import { CompanyService } from '@core/services/company.service';
import { CylinderService } from '@core/services/cylinder.service';
import { CylinderFilters } from '@models/cylinder.model';
import { UserRole } from '@models/role.model';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { LoadingSpinnerComponent } from '@shared/components/ui/loading-spinner/loading-spinner.component';
import { OxygenTankCardComponent } from '../../components/oxygen-tank-card/oxygen-tank-card.component';
import { TankFiltersComponent } from '../../components/tank-filters/tank-filters.component';

@Component({
  selector: 'app-cylinders-list',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    OxygenTankCardComponent,
    TankFiltersComponent,
    DataTableFooterComponent,
  ],
  template: `
    <div class="py-6 space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold text-foreground">Cilindros</h1>
        <p class="text-muted-foreground mt-1">
          Botijões cadastrados: identidade, tipo de gás, volume e preço. A leitura de pressão e
          nível fica no Ponto de Gás.
        </p>
      </div>

      <!-- Filters -->
      <app-tank-filters
        [companyOptions]="companyOptions()"
        (filtersChange)="onFiltersChange($event)"
      />

      <!-- Error State -->
      @if (error()) {
        <div class="bg-destructive/10 border border-destructive/20 rounded-sm p-4 text-destructive">
          <p>{{ error() }}</p>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <app-loading-spinner size="lg" variant="primary" />
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !error() && displayedCylinders().length === 0) {
        <div class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-muted-foreground/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-foreground">Nenhum cilindro encontrado</h3>
          <p class="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
        </div>
      }

      <!-- Cylinders Grid -->
      @if (!isLoading() && !error() && displayedCylinders().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (cylinder of displayedCylinders(); track cylinder.id) {
            <app-oxygen-tank-card [cylinder]="cylinder" />
          }
        </div>
      }

      @if (!isLoading() && !error() && pagination().total > 0) {
        <div class="mt-6 border border-border rounded-sm p-4 bg-card/50">
          <app-data-table-footer
            [pagination]="pagination()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CylindersListComponent implements OnInit {
  private readonly cylinderService = inject(CylinderService);
  private readonly companyService = inject(CompanyService);
  private readonly authService = inject(AuthService);

  /** O filtro por empresa (e o endpoint /companies) só existe para SUPER_ADMIN. */
  protected readonly isSuperAdmin = this.authService.hasRole(UserRole.SUPER_ADMIN);

  readonly displayedCylinders = this.cylinderService.filteredCylinders;
  readonly isLoading = this.cylinderService.isLoading;
  readonly error = this.cylinderService.error;
  readonly pagination = this.cylinderService.pagination;
  readonly companyOptions = computed(() => [
    { label: 'Todas as empresas', value: null },
    ...this.companyService.companyOptions(),
  ]);

  ngOnInit(): void {
    this.cylinderService.getAll();
    // /companies/active é SUPER_ADMIN-only; chamar como USER/ADMIN dava 403 e o
    // interceptor jogava a página inteira pra /errors/forbidden.
    if (this.isSuperAdmin) {
      this.companyService.getActive();
    }
  }

  onFiltersChange(filters: CylinderFilters): void {
    this.cylinderService.updateFilters(filters);
  }

  onPageChange(page: number): void {
    this.cylinderService.getAll({
      page,
      pageSize: this.pagination().pageSize,
    });
  }

  onPageSizeChange(pageSize: number): void {
    this.cylinderService.getAll({
      page: 1,
      pageSize,
    });
  }
}
