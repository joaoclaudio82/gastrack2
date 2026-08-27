import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PressureFilters } from '@models/pressure-reading.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

/**
 * Component for filtering pressure readings.
 * Device is fixed from route; only period (start/end date) and refresh are shown.
 */
@Component({
  selector: 'app-pressure-filters',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-card rounded-sm border border-border p-6 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
        <!-- Date Range - Start -->
        <div class="flex-1 min-w-0">
          <label for="start-date" class="block text-sm font-medium text-foreground mb-2">
            Data Inicial
          </label>
          <input
            id="start-date"
            type="datetime-local"
            class="w-full h-10 px-3 rounded-sm border border-input bg-background text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            [ngModel]="formatDateForInput(currentFilters().startDate)"
            (ngModelChange)="onStartDateChange($event)"
          />
        </div>

        <!-- Date Range - End -->
        <div class="flex-1 min-w-0">
          <label for="end-date" class="block text-sm font-medium text-foreground mb-2">
            Data Final
          </label>
          <input
            id="end-date"
            type="datetime-local"
            class="w-full h-10 px-3 rounded-sm border border-input bg-background text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            [ngModel]="formatDateForInput(currentFilters().endDate)"
            (ngModelChange)="onEndDateChange($event)"
          />
        </div>

        <!-- Clear Filters Button -->
        <div class="flex-shrink-0">
          <button
            type="button"
            class="h-10 px-4 rounded-sm border border-border bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            (click)="onClearFilters()"
          >
            Limpar Filtros
          </button>
        </div>

        <!-- Refresh Button -->
        <div class="flex-shrink-0">
          <app-button
            type="button"
            variant="primary"
            size="md"
            class="h-10 px-4"
            [loading]="loading()"
            (buttonClick)="onRefresh()"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            Atualizar
          </app-button>
        </div>
      </div>
    </div>
  `,
})
export class PressureFiltersComponent {
  readonly currentFilters = input.required<PressureFilters>();
  readonly loading = input<boolean>(false);

  readonly filtersChange = output<Partial<PressureFilters>>();
  readonly clearFilters = output();
  readonly refresh = output();

  onStartDateChange(value: string): void {
    this.filtersChange.emit({ startDate: value ? new Date(value) : undefined });
  }

  onEndDateChange(value: string): void {
    this.filtersChange.emit({ endDate: value ? new Date(value) : undefined });
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  formatDateForInput(date: Date | undefined): string {
    if (!date) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
