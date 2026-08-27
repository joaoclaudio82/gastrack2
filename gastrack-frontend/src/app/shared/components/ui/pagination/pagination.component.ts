import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from '@core/constants/pagination.constants';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <nav aria-label="Paginacao">
      <div class="flex flex-wrap items-center gap-3">
        <p class="text-xs sm:text-sm text-muted-foreground">
          Mostrando {{ startItem() }} - {{ endItem() }} de {{ totalItems() }} registros
        </p>

        <div class="flex items-center gap-2">
          <app-button
            variant="outline"
            size="sm"
            (buttonClick)="goToPreviousPage()"
            [disabled]="page() <= 1"
          >
            Anterior
          </app-button>

          <span class="text-sm font-medium text-foreground">
            Página {{ page() }} de {{ totalPages() }}
          </span>

          <app-button
            variant="outline"
            size="sm"
            (buttonClick)="goToNextPage()"
            [disabled]="page() >= totalPages()"
          >
            Próxima
          </app-button>
        </div>

        <label class="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          Itens por página
          <select
            class="rounded-sm border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
            [value]="pageSize()"
            (change)="onPageSizeChange($event)"
          >
            @for (option of pageSizeOptions(); track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </label>
      </div>
    </nav>
  `,
})
export class PaginationComponent {
  readonly page = input<number>(1);
  readonly pageSize = input<number>(DEFAULT_PAGE_SIZE);
  readonly totalItems = input<number>(0);
  readonly pageSizeOptions = input<number[]>([...DEFAULT_PAGE_SIZE_OPTIONS]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize() || 1;
    return Math.max(1, Math.ceil(total / size));
  });

  protected readonly startItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  protected readonly endItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return Math.min(this.page() * this.pageSize(), this.totalItems());
  });

  protected goToPreviousPage(): void {
    if (this.page() > 1) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  protected goToNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.pageChange.emit(this.page() + 1);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(value);
  }
}
