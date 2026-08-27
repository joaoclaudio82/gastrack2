import { Injectable, inject, signal } from '@angular/core';
import type { GasPrice, GasPriceRequest, GasPriceResponse } from '@models/gas-price.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Preços de gás (/gas-prices). Leitura por empresa (GET ?companyId=);
 * criação append-only (POST cria nova versão). Escrita restrita a SUPER_ADMIN.
 */
@Injectable({ providedIn: 'root' })
export class GasPriceService {
  private readonly api = inject(ApiService);

  private readonly pricesSignal = signal<GasPrice[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly prices = this.pricesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  getByCompany(companyId: number): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .get<GasPrice[]>('/gas-prices', { companyId: String(companyId) })
      .pipe(
        tap((prices) => {
          this.pricesSignal.set(prices);
        }),
        catchError((error: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(error));
          this.pricesSignal.set([]);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  create(data: GasPriceRequest): Observable<GasPriceResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    return this.api.post<GasPriceResponse>('/gas-prices', data).pipe(
      catchError((error: unknown) => {
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  clear(): void {
    this.pricesSignal.set([]);
  }

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) return err.error.message;
    }
    return 'Erro ao processar preço de gás';
  }
}
