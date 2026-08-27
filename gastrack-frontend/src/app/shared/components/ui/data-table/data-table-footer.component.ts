import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  computed,
  input,
  output,
} from '@angular/core';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@core/constants/pagination.constants';
import type { PaginatedResponse } from '@models/api-response.model';

@Component({
  selector: 'app-data-table-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground"
    >
      @if (hasPagination()) {
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label class="flex items-center gap-2">
            Itens por página:
            <select
              class="rounded-sm border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
              [value]="pageSizeValue()"
              (change)="onPageSizeSelect($event)"
            >
              @for (option of pageSizeOptions(); track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
          <span>{{ startItem() }} – {{ endItem() }} de {{ totalItems() }} registros</span>
        </div>

        <div class="flex items-center gap-1 text-foreground">
          <button
            type="button"
            class="rounded-md px-2 py-1 text-sm font-medium transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            (click)="goToFirst()"
            [disabled]="!canGoPrev()"
            aria-label="Primeira página"
          >
            «
          </button>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-sm font-medium transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            (click)="goToPrevious()"
            [disabled]="!canGoPrev()"
            aria-label="Página anterior"
          >
            ‹
          </button>
          <span class="px-2">Página {{ currentPage() }} de {{ totalPages() }}</span>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-sm font-medium transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            (click)="goToNext()"
            [disabled]="!canGoNext()"
            aria-label="Próxima página"
          >
            ›
          </button>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-sm font-medium transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            (click)="goToLast()"
            [disabled]="!canGoNext()"
            aria-label="Última página"
          >
            »
          </button>
        </div>
      } @else {
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground w-full"
        >
          @if (hasSummary()) {
            <div>
              @if (hasSummaryProjection()) {
                <ng-content select="[footer-summary]" />
              } @else {
                {{ summary() }}
              }
            </div>
          }

          @if (hasActions()) {
            <div class="flex flex-wrap items-center gap-2">
              <ng-content select="[footer-actions]" />
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DataTableFooterComponent {
  readonly summary = input<string>('');
  readonly pagination = input<Pick<
    PaginatedResponse<unknown>,
    'total' | 'page' | 'pageSize' | 'totalPages'
  > | null>(null);
  readonly pageSizeOptions = input<number[]>([...DEFAULT_PAGE_SIZE_OPTIONS]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  @ContentChild('[footer-summary]', { read: ElementRef }) private summaryContent?: ElementRef;
  @ContentChild('[footer-actions]', { read: ElementRef }) private actionsContent?: ElementRef;

  protected readonly hasSummaryProjection = computed(() => !!this.summaryContent);
  protected readonly hasPagination = computed(() => !!this.pagination());
  protected readonly totalItems = computed(() => this.pagination()?.total ?? 0);
  protected readonly pageSizeValue = computed(
    () => this.pagination()?.pageSize ?? this.pageSizeOptions()[0],
  );
  protected readonly currentPage = computed(() => this.pagination()?.page ?? 1);
  protected readonly totalPages = computed(() => this.pagination()?.totalPages ?? 1);
  protected readonly startItem = computed(() => {
    const pagination = this.pagination();
    if (!pagination || pagination.total === 0) return 0;
    return (pagination.page - 1) * pagination.pageSize + 1;
  });
  protected readonly endItem = computed(() => {
    const pagination = this.pagination();
    if (!pagination || pagination.total === 0) return 0;
    return Math.min(pagination.page * pagination.pageSize, pagination.total);
  });
  protected readonly canGoPrev = computed(() => this.currentPage() > 1);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages());

  hasSummary(): boolean {
    return this.hasSummaryProjection() || !!this.summary();
  }

  hasActions(): boolean {
    return !!this.actionsContent;
  }

  protected onPageSizeSelect(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(value);
  }

  protected goToFirst(): void {
    if (!this.canGoPrev()) return;
    this.pageChange.emit(1);
  }

  protected goToPrevious(): void {
    if (!this.canGoPrev()) return;
    this.pageChange.emit(this.currentPage() - 1);
  }

  protected goToNext(): void {
    if (!this.canGoNext()) return;
    this.pageChange.emit(this.currentPage() + 1);
  }

  protected goToLast(): void {
    if (!this.canGoNext()) return;
    this.pageChange.emit(this.totalPages());
  }
}
