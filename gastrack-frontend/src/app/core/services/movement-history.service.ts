import { Injectable, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type { MovementHistory, MovementOperation } from '@models/movement-history.model';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for movement history management
 */
@Injectable({ providedIn: 'root' })
export class MovementHistoryService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly historySignal = signal<MovementHistory[]>([]);
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
  readonly history = this.historySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  /**
   * Fetch movement history for an equipment
   */
  getByEquipment(equipmentId: number, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<MovementHistory>(
        `/movement-history/by-equipment/${equipmentId}`,
        params ?? { page: 1, pageSize: 20 },
      )
      .pipe(
        tap((response) => {
          this.historySignal.set(response.items);
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
   * Fetch movement history for a kit
   */
  getByKit(
    kitId: number,
    params?: PaginationParams,
    filters?: { operation?: MovementOperation | null },
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<MovementHistory>(
        `/movement-history/by-kit/${kitId}`,
        params ?? { page: 1, pageSize: 20 },
        filters?.operation ? { operation: filters.operation } : undefined,
      )
      .pipe(
        tap((response) => {
          this.historySignal.set(response.items);
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
   * Fetch all movement history (for SUPER_ADMIN)
   */
  getAll(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<MovementHistory>('/movement-history', params ?? { page: 1, pageSize: 20 })
      .pipe(
        tap((response) => {
          this.historySignal.set(response.items);
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
   * Clear history
   */
  clearHistory(): void {
    this.historySignal.set([]);
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
    return 'Erro ao carregar histórico de movimentações';
  }
}
