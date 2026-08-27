# Signal Service Pattern

## When to Use

- State management for a domain/feature
- CRUD operations with HTTP
- Filtering and derived state
- Shared state across components

---

## Template

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { ConfigService } from '@core/services';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  // ============================================
  // PRIVATE WRITABLE SIGNALS
  // ============================================

  private readonly itemsSignal = signal<Item[]>([]);
  private readonly selectedIdSignal = signal<string | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtersSignal = signal<ItemFilters>({
    search: '',
    status: null,
  });

  // ============================================
  // PUBLIC READONLY SIGNALS
  // ============================================

  readonly items = this.itemsSignal.asReadonly();
  readonly selectedId = this.selectedIdSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();

  // ============================================
  // COMPUTED SIGNALS
  // ============================================

  readonly filteredItems = computed(() => {
    const items = this.itemsSignal();
    const filters = this.filtersSignal();

    return items.filter((item) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!item.name.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      return true;
    });
  });

  readonly selectedItem = computed(() => {
    const id = this.selectedIdSignal();
    if (!id) return null;
    return this.itemsSignal().find((item) => item.id === id) ?? null;
  });

  readonly itemCount = computed(() => this.itemsSignal().length);
  readonly hasItems = computed(() => this.itemsSignal().length > 0);

  readonly statistics = computed(() => ({
    total: this.itemsSignal().length,
    active: this.itemsSignal().filter((i) => i.status === 'active').length,
    inactive: this.itemsSignal().filter((i) => i.status === 'inactive').length,
  }));

  // ============================================
  // CRUD METHODS
  // ============================================

  loadAll(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<Item[]>(`${this.config.apiUrl}/items`).subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.isLoadingSignal.set(false);
      },
      error: (err: unknown) => {
        this.handleError(err);
        this.isLoadingSignal.set(false);
      },
    });
  }

  create(data: CreateItemDto): Observable<Item> {
    return this.http.post<Item>(`${this.config.apiUrl}/items`, data).pipe(
      tap((created) => {
        this.itemsSignal.update((items) => [...items, created]);
      }),
      catchError((err: unknown) => {
        this.handleError(err);
        return throwError(() => err);
      }),
    );
  }

  update(id: string, data: UpdateItemDto): Observable<Item> {
    return this.http.put<Item>(`${this.config.apiUrl}/items/${id}`, data).pipe(
      tap((updated) => {
        this.itemsSignal.update((items) => items.map((item) => (item.id === id ? updated : item)));
      }),
      catchError((err: unknown) => {
        this.handleError(err);
        return throwError(() => err);
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/items/${id}`).pipe(
      tap(() => {
        this.itemsSignal.update((items) => items.filter((item) => item.id !== id));
        if (this.selectedIdSignal() === id) {
          this.selectedIdSignal.set(null);
        }
      }),
      catchError((err: unknown) => {
        this.handleError(err);
        return throwError(() => err);
      }),
    );
  }

  // ============================================
  // STATE METHODS
  // ============================================

  select(id: string | null): void {
    this.selectedIdSignal.set(id);
  }

  updateFilters(filters: Partial<ItemFilters>): void {
    this.filtersSignal.update((current) => ({
      ...current,
      ...filters,
    }));
  }

  clearFilters(): void {
    this.filtersSignal.set({ search: '', status: null });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private handleError(error: unknown): void {
    if (error instanceof Error) {
      this.errorSignal.set(error.message);
    } else if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      typeof (error as { error: { message?: string } }).error?.message === 'string'
    ) {
      this.errorSignal.set((error as { error: { message: string } }).error.message);
    } else {
      this.errorSignal.set('An unexpected error occurred');
    }
  }
}
```

---

## Key Principles

1. **Private writable signals** - Never expose writable signals
2. **Public readonly signals** - Use `asReadonly()`
3. **Computed for derived state** - Never duplicate data
4. **Handle errors consistently** - Use error signal
5. **Type everything** - No `any` types
6. **Optimistic updates** - Update local state immediately on success
7. **Clear separation** - CRUD vs state vs computed

---

## File Location

```
// Domain service
src/app/features/<domain>/services/
├── <domain>.service.ts
└── index.ts

// Core service
src/app/core/services/
├── <service-name>.service.ts
└── index.ts
```

---

## Provider Scope

```typescript
// App-wide singleton (most common)
@Injectable({ providedIn: 'root' })

// Scoped to component (rare)
@Injectable()
// Then add to component's providers array
```
