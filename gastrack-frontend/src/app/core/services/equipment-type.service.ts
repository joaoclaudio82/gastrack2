import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type {
  EquipmentType,
  EquipmentTypeRequest,
  EquipmentTypeResponse,
} from '@models/equipment-type.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for equipment type management (SUPER_ADMIN only)
 */
@Injectable({ providedIn: 'root' })
export class EquipmentTypeService {
  private readonly api = inject(ApiService);

  private readonly equipmentTypesSignal = signal<EquipmentType[]>([]);
  private readonly activeTypesSignal = signal<EquipmentType[]>([]);
  private activeTypesStale = false;
  // ponytail: página única grande em vez de seguir todas as páginas — o catálogo de tipos é
  // global e pequeno (dezenas). Se o warn abaixo aparecer, trocar pelo laço do CompanyService.
  private static readonly ACTIVE_PAGE_SIZE = 200;
  private readonly selectedTypeSignal = signal<EquipmentType | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly paginationSignal = signal<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  // Public readonly signals
  readonly equipmentTypes = this.equipmentTypesSignal.asReadonly();
  readonly activeTypes = this.activeTypesSignal.asReadonly();
  readonly selectedType = this.selectedTypeSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signal for select options
  readonly typeOptions = computed(() =>
    this.activeTypesSignal().map((t) => ({
      label: t.name,
      value: t.id,
    })),
  );

  /**
   * Fetch all equipment types with pagination
   */
  getAll(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<EquipmentType>('/equipment-types', params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.equipmentTypesSignal.set(response.items);
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
   * Fetch active equipment types with optional search (for autocomplete).
   * Sem search: busca 1 vez e reutiliza (só busca de novo se invalidad ou forçar).
   * Com search: busca remota para autocomplete.
   */
  getActive(search?: string, forceRefresh = false): void {
    const haveData = this.activeTypesSignal().length > 0;
    const useCache = !search && !forceRefresh && haveData && !this.activeTypesStale;
    if (useCache) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // `/equipment-types/active` é paginado. Chamar sem `size` deixava o combo com a primeira
    // página e nada avisava que o resto existia — o mesmo buraco que `/companies/active` teve.
    // Um teto maior no backend só adia; quem fecha é o cliente pedir a página e conferir se
    // sobrou alguma.
    const url = search
      ? `/equipment-types/active?search=${encodeURIComponent(search)}`
      : '/equipment-types/active';

    this.api
      .get<EquipmentType[] | { content: EquipmentType[]; totalPages?: number }>(url, {
        size: String(EquipmentTypeService.ACTIVE_PAGE_SIZE),
      })
      .pipe(
        tap((response) => {
          const types = Array.isArray(response) ? response : (response.content ?? []);
          const totalPages = Array.isArray(response) ? 1 : (response.totalPages ?? 1);
          if (totalPages > 1) {
            console.warn(
              `[EquipmentTypeService] ${totalPages} páginas de tipos ativos; exibindo a primeira.`,
            );
          }
          this.activeTypesSignal.set(types);
          if (!search) this.activeTypesStale = false;
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

  /** Marca como desatualizado – próxima getActive() fará nova busca */
  invalidateActiveCache(): void {
    this.activeTypesStale = true;
  }

  /**
   * Fetch equipment type by ID
   */
  getById(id: number): Observable<EquipmentTypeResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<EquipmentTypeResponse>(`/equipment-types/${id}`).pipe(
      tap((type) => {
        this.selectedTypeSignal.set(type);
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
   * Create a new equipment type
   */
  create(data: EquipmentTypeRequest): Observable<EquipmentTypeResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentTypeResponse>('/equipment-types', data).pipe(
      tap((type) => {
        this.equipmentTypesSignal.update((types) => [type, ...types]);
        this.invalidateActiveCache();
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
   * Update an existing equipment type
   */
  update(id: number, data: EquipmentTypeRequest): Observable<EquipmentTypeResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<EquipmentTypeResponse>(`/equipment-types/${id}`, data).pipe(
      tap((type) => {
        this.equipmentTypesSignal.update((types) => types.map((t) => (t.id === id ? type : t)));
        if (this.selectedTypeSignal()?.id === id) {
          this.selectedTypeSignal.set(type);
        }
        this.invalidateActiveCache();
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
   * Deactivate an equipment type
   */
  deactivate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/equipment-types/${id}`).pipe(
      tap(() => {
        this.equipmentTypesSignal.update((types) =>
          types.map((t) => (t.id === id ? { ...t, active: false } : t)),
        );
        this.invalidateActiveCache();
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
   * Activate an equipment type
   */
  activate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/equipment-types/${id}/activate`, {}).pipe(
      tap(() => {
        this.equipmentTypesSignal.update((types) =>
          types.map((t) => (t.id === id ? { ...t, active: true } : t)),
        );
        this.invalidateActiveCache();
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
   * Clear selected type
   */
  clearSelected(): void {
    this.selectedTypeSignal.set(null);
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
    return 'Erro ao processar tipo de equipamento';
  }
}
