import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type {
  Contract,
  ContractAddress,
  ContractAddressesUpdateRequest,
  ContractRequest,
  ContractResponse,
  ContractStatus,
  ContractStatusUpdateRequest,
} from '@models/contract.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for contract management
 */
@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly contractsSignal = signal<Contract[]>([]);
  private readonly selectedContractSignal = signal<Contract | null>(null);
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
  private readonly contractAddressesSignal = signal<ContractAddress[]>([]);
  private readonly addressesLoadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly contracts = this.contractsSignal.asReadonly();
  readonly selectedContract = this.selectedContractSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly contractAddresses = this.contractAddressesSignal.asReadonly();
  readonly areContractAddressesLoading = this.addressesLoadingSignal.asReadonly();

  // Computed signal for select options
  readonly contractOptions = computed(() =>
    this.contractsSignal().map((c) => ({
      label: c.contractNumber,
      value: c.id,
    })),
  );

  /**
   * Fetch all contracts with pagination
   */
  getAll(
    params?: PaginationParams,
    filters?: { status?: ContractStatus | null; search?: string | null },
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Contract>(
        '/contracts',
        params ?? { page: 1, pageSize: 10 },
        this.buildFilterParams(filters),
      )
      .pipe(
        tap((response) => {
          this.contractsSignal.set(response.items);
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
   * Fetch active contracts for a specific company
   */
  getByCompany(companyId: number, params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Contract>(
        `/contracts/by-company/${companyId}`,
        params ?? { page: 1, pageSize: 10 },
      )
      .pipe(
        tap((response) => {
          this.contractsSignal.set(response.items);
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
   * Fetch contracts by company and status
   */
  getByCompanyAndStatus(
    companyId: number,
    status: ContractStatus,
    params?: PaginationParams,
  ): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Contract>(
        `/contracts/by-company/${companyId}/status/${status}`,
        params ?? { page: 1, pageSize: 10 },
      )
      .pipe(
        tap((response) => {
          this.contractsSignal.set(response.items);
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
   * Fetch contract by ID
   */
  getById(id: number): Observable<ContractResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<ContractResponse>(`/contracts/${id}`).pipe(
      tap((contract) => {
        this.selectedContractSignal.set(contract);
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
   * Fetch allowed addresses for a contract
   */
  getAllowedAddresses(contractId: number): void {
    this.addressesLoadingSignal.set(true);
    this.contractAddressesSignal.set([]);

    this.api
      .get<ContractAddress[]>(`/contracts/${contractId}/addresses`)
      .pipe(
        tap((addresses) => {
          this.contractAddressesSignal.set(addresses);
        }),
        catchError((error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorSignal.set(message);
          return throwError(() => error);
        }),
        finalize(() => {
          this.addressesLoadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Create a new contract
   */
  create(data: ContractRequest): Observable<ContractResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<ContractResponse>('/contracts', data).pipe(
      tap((contract) => {
        this.contractsSignal.update((contracts) => [contract, ...contracts]);
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
   * Update an existing contract
   */
  update(id: number, data: ContractRequest): Observable<ContractResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<ContractResponse>(`/contracts/${id}`, data).pipe(
      tap((contract) => {
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === id ? contract : c)),
        );
        if (this.selectedContractSignal()?.id === id) {
          this.selectedContractSignal.set(contract);
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
   * Update contract status
   */
  updateStatus(id: number, request: ContractStatusUpdateRequest): Observable<ContractResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.patch<ContractResponse>(`/contracts/${id}/status`, request).pipe(
      tap((contract) => {
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === id ? contract : c)),
        );
        if (this.selectedContractSignal()?.id === id) {
          this.selectedContractSignal.set(contract);
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
   * Update allowed addresses for a contract
   */
  updateAddresses(
    id: number,
    request: ContractAddressesUpdateRequest,
  ): Observable<ContractResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<ContractResponse>(`/contracts/${id}/addresses`, request).pipe(
      tap((contract) => {
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === id ? contract : c)),
        );
        if (this.selectedContractSignal()?.id === id) {
          this.selectedContractSignal.set(contract);
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
   * Deactivate a contract
   */
  deactivate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/contracts/${id}`).pipe(
      tap(() => {
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === id ? { ...c, active: false } : c)),
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
   * Clear selected contract
   */
  clearSelected(): void {
    this.selectedContractSignal.set(null);
    this.contractAddressesSignal.set([]);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Activate a deactivated contract
   */
  activate(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/contracts/${id}/activate`, {}).pipe(
      tap(() => {
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === id ? { ...c, active: true } : c)),
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
    return 'Erro ao processar contrato';
  }

  private buildFilterParams(filters?: { status?: ContractStatus | null; search?: string | null }) {
    if (!filters) {
      return {};
    }

    const params: Record<string, string> = {};
    if (filters.status) {
      params['status'] = filters.status;
    }
    if (filters.search?.trim()) {
      params['search'] = filters.search.trim();
    }
    return params;
  }
}
