import { Injectable, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type { PontoGas, PontoGasRequest, PontoGasResponse } from '@models/ponto-gas.model';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PontoGasService {
  private readonly api = inject(ApiService);

  private readonly gasPointsSignal = signal<PontoGas[]>([]);
  private readonly selectedGasPointSignal = signal<PontoGas | null>(null);
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

  private readonly gasPointsByAddressSignal = signal<PontoGas[]>([]);

  readonly gasPoints = this.gasPointsSignal.asReadonly();
  readonly gasPointsByAddress = this.gasPointsByAddressSignal.asReadonly();
  readonly selectedGasPoint = this.selectedGasPointSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  getByAddressId(
    addressId: number,
    params?: PaginationParams,
    options?: { active?: boolean; kitId?: number },
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const extraParams: Record<string, string | number | boolean> = { addressId };
    if (options?.active !== undefined) {
      extraParams['active'] = options.active;
    }
    if (options?.kitId !== undefined) {
      extraParams['kitId'] = options.kitId;
    }
    this.api
      .getPaginated<PontoGas>('/gas-points', params ?? { page: 1, pageSize: 100 }, extraParams)
      .pipe(
        catchError((error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorSignal.set(message);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
      )
      .subscribe((response) => {
        this.gasPointsByAddressSignal.set(response.items);
        this.gasPointsSignal.set(response.items);
        this.paginationSignal.set({
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        });
      });
  }

  clearGasPointsByAddress(): void {
    this.gasPointsByAddressSignal.set([]);
  }

  clearList(): void {
    this.gasPointsSignal.set([]);
    this.paginationSignal.set({
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  }

  getAll(params?: PaginationParams, active?: boolean): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<PontoGas>(
        '/gas-points',
        params ?? { page: 1, pageSize: 10 },
        active !== undefined ? { active } : undefined,
      )
      .pipe(
        catchError((error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorSignal.set(message);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
      )
      .subscribe((response) => {
        this.gasPointsSignal.set(response.items);
        this.paginationSignal.set({
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        });
      });
  }

  getById(id: number): Observable<PontoGasResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<PontoGasResponse>(`/gas-points/${id}`).pipe(
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

  create(data: PontoGasRequest): Observable<PontoGasResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<PontoGasResponse>('/gas-points', data).pipe(
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

  update(id: number, data: PontoGasRequest): Observable<PontoGasResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<PontoGasResponse>(`/gas-points/${id}`, data).pipe(
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

  deactivate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/gas-points/${id}`).pipe(
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

  delete(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/gas-points/${id}/hard-delete`).pipe(
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

  activate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/gas-points/${id}/activate`, {}).pipe(
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

  clearSelected(): void {
    this.selectedGasPointSignal.set(null);
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
    return 'Erro ao processar ponto de gás';
  }
}
