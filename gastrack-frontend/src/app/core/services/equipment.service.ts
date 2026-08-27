import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type {
  Equipment,
  EquipmentAssignRequest,
  EquipmentBatchAssignRequest,
  EquipmentBatchAssignResponse,
  EquipmentCondition,
  EquipmentRequest,
  EquipmentResponse,
  EquipmentTransferRequest,
  SensorOptionResponse,
} from '@models/equipment.model';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for equipment management
 */
@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly equipmentsSignal = signal<Equipment[]>([]);
  private readonly unassignedEquipmentsSignal = signal<Equipment[]>([]);
  private readonly selectedEquipmentSignal = signal<Equipment | null>(null);
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
  readonly equipments = this.equipmentsSignal.asReadonly();
  readonly unassignedEquipments = this.unassignedEquipmentsSignal.asReadonly();
  readonly selectedEquipment = this.selectedEquipmentSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signal for select options
  readonly equipmentOptions = computed(() =>
    this.equipmentsSignal().map((e) => ({
      label: `${e.assetTag} - ${e.equipmentTypeName}`,
      value: e.id,
    })),
  );

  // Computed signal for unassigned equipment options
  readonly unassignedOptions = computed(() =>
    this.unassignedEquipmentsSignal().map((e) => ({
      label: `${e.assetTag} - ${e.equipmentTypeName}`,
      value: e.id,
    })),
  );

  /**
   * Fetch all equipment with pagination and optional filters
   */
  getAll(
    params?: PaginationParams,
    filters?: {
      assignment?: 'all' | 'assigned' | 'unassigned';
      condition?: EquipmentCondition | null;
      typeId?: number | null;
      kitId?: number | null;
      companyId?: number | null;
    },
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Equipment>(
        '/equipment',
        params ?? { page: 1, pageSize: 10 },
        this.buildFilterParams(filters),
      )
      .pipe(
        tap((response) => {
          this.equipmentsSignal.set(response.items);
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
   * Fetch equipment by kit
   */
  getByKit(kitId: number, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Equipment>(`/equipment/by-kit/${kitId}`, params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.equipmentsSignal.set(response.items);
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
   * Fetch sensor options for a kit (ESP32 + port 1-8) for associating sensors to gas points
   */
  getSensorOptionsForKit(kitId: number): Observable<SensorOptionResponse[]> {
    return this.api.get<SensorOptionResponse[]>(`/equipment/kits/${kitId}/sensor-options`);
  }

  /**
   * Fetch equipment by type
   */
  getByType(typeId: number, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Equipment>(`/equipment/by-type/${typeId}`, params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.equipmentsSignal.set(response.items);
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
   * Fetch unassigned equipment
   */
  /**
   * Signal-free fetch of unassigned equipment for pickers (e.g. maintenance swap). Returns the
   * list without touching the shared list/pagination signals, so the caller's table is untouched.
   */
  getUnassignedCandidates(): Observable<Equipment[]> {
    return this.api
      .getPaginated<Equipment>('/equipment/unassigned', { page: 1, pageSize: 200 })
      .pipe(map((r) => r.items));
  }

  getUnassigned(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Equipment>('/equipment/unassigned', params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.unassignedEquipmentsSignal.set(response.items);
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
   * Fetch equipment by ID
   */
  getById(id: number): Observable<EquipmentResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<EquipmentResponse>(`/equipment/${id}`).pipe(
      tap((equipment) => {
        this.selectedEquipmentSignal.set(equipment);
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
   * Create new equipment
   */
  create(data: EquipmentRequest): Observable<EquipmentResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentResponse>('/equipment', data).pipe(
      tap((equipment) => {
        this.equipmentsSignal.update((equipments) => [equipment, ...equipments]);
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
   * Update existing equipment
   */
  update(id: number, data: EquipmentRequest): Observable<EquipmentResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<EquipmentResponse>(`/equipment/${id}`, data).pipe(
      tap((equipment) => {
        this.equipmentsSignal.update((equipments) =>
          equipments.map((e) => (e.id === id ? equipment : e)),
        );
        if (this.selectedEquipmentSignal()?.id === id) {
          this.selectedEquipmentSignal.set(equipment);
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
   * Assign equipment to a kit
   */
  assignToKit(id: number, request: EquipmentAssignRequest): Observable<EquipmentResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.patch<EquipmentResponse>(`/equipment/${id}/assign-kit`, request).pipe(
      tap((equipment) => {
        this.equipmentsSignal.update((equipments) =>
          equipments.map((e) => (e.id === id ? equipment : e)),
        );
        // Remove from unassigned list
        this.unassignedEquipmentsSignal.update((equipments) =>
          equipments.filter((e) => e.id !== id),
        );
        if (this.selectedEquipmentSignal()?.id === id) {
          this.selectedEquipmentSignal.set(equipment);
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
   * Batch assign multiple equipment to a kit
   */
  assignBatchToKit(request: EquipmentBatchAssignRequest): Observable<EquipmentBatchAssignResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<EquipmentBatchAssignResponse>('/equipment/batch/assign-kit', request).pipe(
      tap((response) => {
        // Remove assigned equipment from unassigned list
        const assignedIds = new Set(response.assigned.map((e) => e.id));
        this.unassignedEquipmentsSignal.update((equipments) =>
          equipments.filter((e) => !assignedIds.has(e.id)),
        );
        // Add assigned equipment to main list if they match current context
        this.equipmentsSignal.update((equipments) => {
          const existingIds = new Set(equipments.map((e) => e.id));
          const newEquipments = response.assigned.filter((e) => !existingIds.has(e.id));
          return [...equipments, ...newEquipments];
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
    );
  }

  /**
   * Remove equipment from kit
   */
  removeFromKit(id: number): Observable<EquipmentResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.patch<EquipmentResponse>(`/equipment/${id}/remove-from-kit`, {}).pipe(
      tap((equipment) => {
        // Remove from kit's equipment list
        this.equipmentsSignal.update((equipments) => equipments.filter((e) => e.id !== id));
        // Add to unassigned list
        this.unassignedEquipmentsSignal.update((equipments) => {
          // Only add if not already in the list
          if (equipments.some((e) => e.id === equipment.id)) {
            return equipments;
          }
          return [...equipments, equipment];
        });
        if (this.selectedEquipmentSignal()?.id === id) {
          this.selectedEquipmentSignal.set(equipment);
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
   * Transfer equipment to another kit
   */
  transfer(id: number, request: EquipmentTransferRequest): Observable<EquipmentResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.patch<EquipmentResponse>(`/equipment/${id}/transfer`, request).pipe(
      tap((equipment) => {
        this.equipmentsSignal.update((equipments) =>
          equipments.map((e) => (e.id === id ? equipment : e)),
        );
        if (this.selectedEquipmentSignal()?.id === id) {
          this.selectedEquipmentSignal.set(equipment);
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
   * Deactivate equipment
   */
  deactivate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/equipment/${id}`).pipe(
      tap(() => {
        this.equipmentsSignal.update((equipments) =>
          equipments.map((e) => (e.id === id ? { ...e, active: false } : e)),
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
   * Clear selected equipment
   */
  clearSelected(): void {
    this.selectedEquipmentSignal.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Activate a deactivated equipment
   */
  activate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/equipment/${id}/activate`, {}).pipe(
      tap(() => {
        this.equipmentsSignal.update((equipments) =>
          equipments.map((e) => (e.id === id ? { ...e, active: true } : e)),
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

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) {
        return err.error.message;
      }
    }
    return 'Erro ao processar equipamento';
  }

  private buildFilterParams(filters?: {
    assignment?: 'all' | 'assigned' | 'unassigned';
    condition?: EquipmentCondition | null;
    typeId?: number | null;
    kitId?: number | null;
    companyId?: number | null;
  }): Record<string, string | number> {
    if (!filters) {
      return {};
    }

    const params: Record<string, string | number> = {};

    if (filters.assignment && filters.assignment !== 'all') {
      params['assignment'] = filters.assignment;
    }
    if (filters.condition) {
      params['condition'] = filters.condition;
    }
    if (filters.typeId) {
      params['typeId'] = filters.typeId;
    }
    if (filters.kitId) {
      params['kitId'] = filters.kitId;
    }
    if (filters.companyId) {
      params['companyId'] = filters.companyId;
    }

    return params;
  }
}
