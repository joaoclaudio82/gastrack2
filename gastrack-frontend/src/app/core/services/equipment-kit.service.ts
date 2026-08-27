import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type {
  EquipmentKit,
  EquipmentKitRequest,
  EquipmentKitResponse,
  EquipmentKitStatusUpdateRequest,
  KitInstallRequest,
  KitStatus,
  KitUninstallRequest,
  SwapEspRequest,
  SwapSensorRequest,
} from '@models/equipment-kit.model';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for equipment kit management
 */
@Injectable({ providedIn: 'root' })
export class EquipmentKitService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly kitsSignal = signal<EquipmentKit[]>([]);
  private readonly selectedKitSignal = signal<EquipmentKit | null>(null);
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
  readonly kits = this.kitsSignal.asReadonly();
  readonly selectedKit = this.selectedKitSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signal for select options
  readonly kitOptions = computed(() =>
    this.kitsSignal().map((k) => ({
      label: k.kitCode,
      value: k.id,
    })),
  );

  /**
   * Fetch all equipment kits with pagination
   */
  getAll(
    params?: PaginationParams,
    filters?: {
      status?: KitStatus | null;
      contractId?: number | null;
    },
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<EquipmentKit>(
        '/equipment-kits',
        params ?? { page: 1, pageSize: 10 },
        this.buildFilterParams(filters),
      )
      .pipe(
        tap((response) => {
          this.kitsSignal.set(response.items);
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
   * Count kits for a given status (para as abas Instalados/Não-instalados).
   * Consulta leve (pageSize 1) que só lê o total — não toca os signals da lista.
   */
  getCountByStatus(status: KitStatus, contractId?: number | null): Observable<number> {
    return this.api
      .getPaginated<EquipmentKit>(
        '/equipment-kits',
        { page: 1, pageSize: 1 },
        this.buildFilterParams(contractId == null ? { status } : { status, contractId }),
      )
      .pipe(map((response) => response.total));
  }

  /**
   * Fetch equipment kits by contract
   */
  getByContract(contractId: number, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<EquipmentKit>(
        `/equipment-kits/by-contract/${contractId}`,
        params ?? { page: 1, pageSize: 10 },
      )
      .pipe(
        tap((response) => {
          this.kitsSignal.set(response.items);
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
   * Fetch equipment kits by company and status
   */
  getByCompanyAndStatus(companyId: number, status: KitStatus, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<EquipmentKit>(
        `/equipment-kits/by-company/${companyId}/status/${status}`,
        params ?? { page: 1, pageSize: 10 },
      )
      .pipe(
        tap((response) => {
          this.kitsSignal.set(response.items);
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
   * Fetch equipment kit by ID
   */
  getById(id: number): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<EquipmentKitResponse>(`/equipment-kits/${id}`).pipe(
      tap((kit) => {
        this.selectedKitSignal.set(kit);
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
   * Create a new equipment kit
   */
  create(data: EquipmentKitRequest): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentKitResponse>('/equipment-kits', data).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => [kit, ...kits]);
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
   * Update an existing equipment kit
   */
  update(id: number, data: EquipmentKitRequest): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<EquipmentKitResponse>(`/equipment-kits/${id}`, data).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => kits.map((k) => (k.id === id ? kit : k)));
        if (this.selectedKitSignal()?.id === id) {
          this.selectedKitSignal.set(kit);
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
   * Update equipment kit status
   */
  updateStatus(
    id: number,
    request: EquipmentKitStatusUpdateRequest,
  ): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.patch<EquipmentKitResponse>(`/equipment-kits/${id}/status`, request).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => kits.map((k) => (k.id === id ? kit : k)));
        if (this.selectedKitSignal()?.id === id) {
          this.selectedKitSignal.set(kit);
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
   * Deactivate an equipment kit
   */
  deactivate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/equipment-kits/${id}`).pipe(
      tap(() => {
        this.kitsSignal.update((kits) =>
          kits.map((k) => (k.id === id ? { ...k, active: false } : k)),
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
   * Clear selected kit
   */
  clearSelected(): void {
    this.selectedKitSignal.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Activate a deactivated equipment kit
   */
  activate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/equipment-kits/${id}/activate`, {}).pipe(
      tap(() => {
        this.kitsSignal.update((kits) =>
          kits.map((k) => (k.id === id ? { ...k, active: true } : k)),
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
   * Install kit at address
   */
  installKit(id: number, request: KitInstallRequest): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentKitResponse>(`/equipment-kits/${id}/install`, request).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => kits.map((k) => (k.id === id ? kit : k)));
        if (this.selectedKitSignal()?.id === id) {
          this.selectedKitSignal.set(kit);
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
   * Uninstall kit from location
   */
  uninstallKit(id: number, request: KitUninstallRequest): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentKitResponse>(`/equipment-kits/${id}/uninstall`, request).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => kits.map((k) => (k.id === id ? kit : k)));
        if (this.selectedKitSignal()?.id === id) {
          this.selectedKitSignal.set(kit);
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
   * Swap the kit's ESP32 gateway (maintenance).
   */
  swapEsp(id: number, request: SwapEspRequest): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentKitResponse>(`/equipment-kits/${id}/swap-esp`, request).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => kits.map((k) => (k.id === id ? kit : k)));
        if (this.selectedKitSignal()?.id === id) {
          this.selectedKitSignal.set(kit);
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
   * Swap a single sensor of the kit (maintenance).
   */
  swapSensor(id: number, request: SwapSensorRequest): Observable<EquipmentKitResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentKitResponse>(`/equipment-kits/${id}/swap-sensor`, request).pipe(
      tap((kit) => {
        this.kitsSignal.update((kits) => kits.map((k) => (k.id === id ? kit : k)));
        if (this.selectedKitSignal()?.id === id) {
          this.selectedKitSignal.set(kit);
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

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) {
        return err.error.message;
      }
    }
    return 'Erro ao processar kit de equipamento';
  }

  private buildFilterParams(filters?: { status?: KitStatus | null; contractId?: number | null }) {
    if (!filters) {
      return {};
    }

    const params: Record<string, string | number> = {};

    if (filters.status) {
      params['status'] = filters.status;
    }
    if (filters.contractId) {
      params['contractId'] = filters.contractId;
    }

    return params;
  }
}
