import { Injectable, inject, signal } from '@angular/core';
import type { RefillEvent, RefillRequest } from '@models/refill.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Troca de botijão — a ação do cliente sobre o próprio gás.
 *
 * O endpoint já existia (`POST /gas-points/{id}/refill`, liberado até para USER),
 * mas nenhuma tela chamava: o cliente trocava o casco e o cadastro envelhecia sozinho.
 * Como o volume dos cilindros passou a alimentar a previsão de autonomia, cadastro
 * velho virou previsão errada.
 */
@Injectable({ providedIn: 'root' })
export class RefillService {
  private readonly api = inject(ApiService);

  private readonly eventsSignal = signal<RefillEvent[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);

  readonly events = this.eventsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  registerRefill(gasPointId: number, request: RefillRequest): Observable<RefillEvent> {
    this.isLoadingSignal.set(true);

    return this.api.post<RefillEvent>(`/gas-points/${String(gasPointId)}/refill`, request).pipe(
      catchError((error: unknown) => throwError(() => error)),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }

  loadHistory(gasPointId: number): Observable<RefillEvent[]> {
    this.isLoadingSignal.set(true);

    return this.api.get<RefillEvent[]>(`/gas-points/${String(gasPointId)}/refills`).pipe(
      tap((events) => {
        this.eventsSignal.set(events);
      }),
      catchError((error: unknown) => throwError(() => error)),
      finalize(() => {
        this.isLoadingSignal.set(false);
      }),
    );
  }
}
