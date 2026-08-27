import { Injectable, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type {
  CylinderModel,
  CylinderModelRequest,
  CylinderModelResponse,
} from '@models/cylinder-model.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * CRUD do catálogo de modelos de cilindro (/cylinder-models).
 * Escrita restrita a SUPER_ADMIN (enforçada no backend); leitura ADMIN/SUPER.
 */
@Injectable({ providedIn: 'root' })
export class CylinderModelService {
  private readonly api = inject(ApiService);

  private readonly modelsSignal = signal<CylinderModel[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly paginationSignal = signal({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  readonly models = this.modelsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  getAll(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<CylinderModel>('/cylinder-models', params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.modelsSignal.set(response.items);
          this.paginationSignal.set({
            total: response.total,
            page: response.page,
            pageSize: response.pageSize,
            totalPages: response.totalPages,
          });
        }),
        catchError((error: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(error));
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  create(data: CylinderModelRequest): Observable<CylinderModelResponse> {
    return this.write(this.api.post<CylinderModelResponse>('/cylinder-models', data));
  }

  update(id: number, data: CylinderModelRequest): Observable<CylinderModelResponse> {
    return this.write(this.api.put<CylinderModelResponse>(`/cylinder-models/${id}`, data));
  }

  delete(id: number): Observable<unknown> {
    return this.write(this.api.delete<unknown>(`/cylinder-models/${id}`));
  }

  private write<T>(source: Observable<T>): Observable<T> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    return source.pipe(
      catchError((error: unknown) => {
        this.errorSignal.set(this.extractErrorMessage(error));
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
      if (err.error?.message) return err.error.message;
    }
    return 'Erro ao processar modelo de cilindro';
  }
}
