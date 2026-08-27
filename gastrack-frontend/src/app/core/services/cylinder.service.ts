import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type { Cylinder, CylinderFilters, CylinderRequest } from '@models/cylinder.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CylinderService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly cylindersSignal = signal<Cylinder[]>([]);
  private readonly selectedCylinderSignal = signal<Cylinder | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtersSignal = signal<CylinderFilters>({
    searchTerm: '',
    addressId: null,
    companyId: null,
    pontoGasId: null,
  });
  private readonly paginationSignal = signal<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  // Public readonly signals
  readonly cylinders = this.cylindersSignal.asReadonly();
  readonly selectedCylinder = this.selectedCylinderSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Visible cylinders come directly from backend (server-side filtering)
  readonly filteredCylinders = computed(() => this.cylindersSignal());

  /**
   * Fetch all cylinders with pagination
   */
  getAll(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const paginationParams = params ?? this.getDefaultPagination();
    const extraParams = this.buildFilterParams();

    this.api
      .getPaginated<Cylinder>('/cylinders', paginationParams, extraParams)
      .pipe(
        tap((response) => {
          this.cylindersSignal.set(response.items);
          this.paginationSignal.set({
            total: response.total,
            page: response.page,
            pageSize: response.pageSize,
            totalPages: response.totalPages,
          });
        }),
        catchError((error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorSignal.set(message);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Fetch cylinders by address
   */
  getByAddress(addressId: number, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Cylinder>(
        `/cylinders/by-address/${addressId}`,
        params ?? { page: 1, pageSize: 20 },
      )
      .pipe(
        tap((response) => {
          this.cylindersSignal.set(response.items);
          this.paginationSignal.set({
            total: response.total,
            page: response.page,
            pageSize: response.pageSize,
            totalPages: response.totalPages,
          });
        }),
        catchError((error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorSignal.set(message);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Fetch cylinder by ID
   */
  getById(id: number): Observable<Cylinder> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Cylinder>(`/cylinders/${id}`).pipe(
      tap((cylinder) => {
        this.selectedCylinderSignal.set(cylinder);
      }),
      catchError((error: unknown) => {
        const message = this.extractErrorMessage(error);
        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  /**
   * Create new cylinder
   */
  create(data: CylinderRequest): Observable<Cylinder> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<Cylinder>('/cylinders', data).pipe(
      tap((cylinder) => {
        this.cylindersSignal.update((cylinders) => [cylinder, ...cylinders]);
      }),
      catchError((error: unknown) => {
        const message = this.extractErrorMessage(error);
        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  /**
   * Update existing cylinder
   */
  update(id: number, data: CylinderRequest): Observable<Cylinder> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<Cylinder>(`/cylinders/${id}`, data).pipe(
      tap((cylinder) => {
        this.cylindersSignal.update((cylinders) =>
          cylinders.map((c) => (c.id === id ? cylinder : c)),
        );
        if (this.selectedCylinderSignal()?.id === id) {
          this.selectedCylinderSignal.set(cylinder);
        }
      }),
      catchError((error: unknown) => {
        const message = this.extractErrorMessage(error);
        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  /**
   * Deactivate cylinder
   */
  deactivate(id: number): Observable<null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<null>(`/cylinders/${id}`).pipe(
      tap(() => {
        this.cylindersSignal.update((cylinders) =>
          cylinders.map((c) => (c.id === id ? { ...c, active: false } : c)),
        );
      }),
      catchError((error: unknown) => {
        const message = this.extractErrorMessage(error);
        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  /**
   * Activate cylinder
   */
  activate(id: number): Observable<null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<null>(`/cylinders/${id}/activate`, {}).pipe(
      tap(() => {
        this.cylindersSignal.update((cylinders) =>
          cylinders.map((c) => (c.id === id ? { ...c, active: true } : c)),
        );
      }),
      catchError((error: unknown) => {
        const message = this.extractErrorMessage(error);
        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  /**
   * Update filters
   */
  updateFilters(filters: Partial<CylinderFilters>): void {
    this.filtersSignal.update((current) => ({ ...current, ...filters }));
    this.getAll({ page: 1, pageSize: this.paginationSignal().pageSize || 20 });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filtersSignal.set({
      searchTerm: '',
      addressId: null,
      companyId: null,
    });
    this.getAll({ page: 1, pageSize: this.paginationSignal().pageSize || 20 });
  }

  private buildFilterParams(): Record<string, string | number> {
    const filters = this.filtersSignal();
    const params: Record<string, string | number> = {};

    const trimmedSearch = filters.searchTerm?.trim();
    if (trimmedSearch) {
      params['search'] = trimmedSearch;
    }
    if (filters.addressId) {
      params['addressId'] = filters.addressId;
    }
    if (filters.companyId) {
      params['companyId'] = filters.companyId;
    }
    if (filters.pontoGasId) {
      params['pontoGasId'] = filters.pontoGasId;
    }

    return params;
  }

  private getDefaultPagination(): PaginationParams {
    const pagination = this.paginationSignal();
    return {
      page: pagination.page || 1,
      pageSize: pagination.pageSize || 20,
    };
  }

  /**
   * Clear selected cylinder
   */
  clearSelected(): void {
    this.selectedCylinderSignal.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) {
        return err.error.message;
      }
    }
    return 'Erro ao processar cilindro';
  }
}
