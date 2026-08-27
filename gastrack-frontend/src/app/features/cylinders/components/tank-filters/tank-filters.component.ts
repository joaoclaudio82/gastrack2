import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CylinderFilters } from '@models/cylinder.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent, SelectOption } from '@shared/components/ui/select/select.component';

@Component({
  selector: 'app-tank-filters',
  standalone: true,
  imports: [FormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div class="bg-card rounded-sm shadow-sm border border-border p-4 mb-6">
      <div
        [class]="
          canFilterByCompany()
            ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4'
        "
      >
        <!-- Search Input -->
        <app-input
          label="Buscar cilindro"
          placeholder="Nº de série..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="onFilterChange()"
        />

        <!--
          Quem opera uma empresa só recebe a lista vazia (/companies/active é SUPER_ADMIN-only):
          sobrava um "Empresa" com "Todas as empresas" e mais nada para escolher.
        -->
        @if (canFilterByCompany()) {
          <app-select
            label="Empresa"
            [options]="companyOptions()"
            [ngModel]="selectedCompany"
            (ngModelChange)="onCompanyChange($event)"
            [clearable]="true"
          />
        }

        <!-- Clear Filters Button -->
        <div class="flex items-end">
          <app-button variant="outline" (click)="clearFilters()" [fullWidth]="true">
            Limpar Filtros
          </app-button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TankFiltersComponent {
  readonly filtersChange = output<CylinderFilters>();
  readonly companyOptions = input<SelectOption[]>([]);

  /** Só há o que filtrar quando existe mais de uma empresa além do "Todas as empresas". */
  protected readonly canFilterByCompany = computed(() => this.companyOptions().length > 1);

  searchTerm = '';
  selectedCompany: number | null = null;

  onFilterChange(): void {
    this.filtersChange.emit({
      searchTerm: this.searchTerm,
      addressId: null,
      companyId: this.selectedCompany,
    });
  }

  onCompanyChange(value: number | string | null): void {
    this.selectedCompany = this.normalizeOptionValue(value);
    this.onFilterChange();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCompany = null;
    this.onFilterChange();
  }

  private normalizeOptionValue(value: number | string | null): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return typeof value === 'string' ? Number(value) : value;
  }
}
