import { Injectable, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type { DevicePingLog } from '@models/device-ping-log.model';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DevicePingLogService {
  private readonly api = inject(ApiService);

  private readonly logsSignal = signal<DevicePingLog[]>([]);
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
    pageSize: 20,
    totalPages: 0,
  });

  readonly logs = this.logsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  getAll(
    params?: PaginationParams,
    filters?: {
      serial?: string | null;
      unregistered?: boolean;
    },
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<DevicePingLog>(
        '/device-ping-logs',
        params ?? { page: 1, pageSize: 20, sortBy: 'pingedAt', sortOrder: 'desc' },
        this.buildFilterParams(filters),
      )
      .pipe(
        tap((response) => {
          this.logsSignal.set(response.items);
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
    return 'Erro ao carregar logs de ping';
  }

  private buildFilterParams(filters?: {
    serial?: string | null;
    unregistered?: boolean;
  }): Record<string, string | number | boolean> {
    if (!filters) {
      return {};
    }

    const params: Record<string, string | number | boolean> = {};

    if (filters.serial) {
      params['serial'] = filters.serial;
    }
    if (filters.unregistered) {
      params['unregistered'] = true;
    }

    return params;
  }
}
