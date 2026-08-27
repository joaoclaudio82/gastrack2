import { Injectable, computed, inject, signal } from '@angular/core';
import type { Address, AddressRequest, AddressResponse } from '@models/address.model';
import type { PaginationParams } from '@models/api-response.model';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for address management
 */
@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly addressesSignal = signal<Address[]>([]);
  private readonly globalActiveAddressesSignal = signal<Address[]>([]);
  private readonly companyAddressesSignal = signal<Address[]>([]);
  private readonly selectedAddressSignal = signal<Address | null>(null);
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
  readonly addresses = this.addressesSignal.asReadonly();
  readonly activeAddresses = this.globalActiveAddressesSignal.asReadonly();
  readonly companyAddresses = this.companyAddressesSignal.asReadonly();
  readonly selectedAddress = this.selectedAddressSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signal for select options
  readonly addressOptions = computed(() =>
    this.globalActiveAddressesSignal().map((a) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    })),
  );

  readonly companyAddressOptions = computed(() =>
    this.companyAddressesSignal().map((a) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    })),
  );

  /**
   * Fetch all addresses with pagination
   */
  getAll(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Address>('/addresses', params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.addressesSignal.set(response.items);
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
   * Fetch all active addresses (for select dropdowns)
   */
  getActive(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Address>('/addresses', { page: 1, pageSize: 100 }, { active: true })
      .pipe(
        tap((response) => {
          this.globalActiveAddressesSignal.set(response.items);
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
   * Fetch addresses by company (for select dropdowns filtered by company)
   */
  getByCompany(companyId: number): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Address>(`/addresses/company/${companyId}`, { page: 1, pageSize: 100 })
      .pipe(
        tap((response) => {
          this.companyAddressesSignal.set(response.items.filter((a) => a.active));
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
   * Fetch addresses by company as Observable (for inline company form)
   */
  getAddressesByCompany(companyId: number): Observable<Address[]> {
    return this.api
      .getPaginated<Address>(`/addresses/company/${companyId}`, {
        page: 1,
        pageSize: 100,
      })
      .pipe(
        map((response) => response.items),
        catchError((error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorSignal.set(message);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Fetch address by ID
   */
  getById(id: number): Observable<AddressResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<AddressResponse>(`/addresses/${id}`).pipe(
      tap((address) => {
        this.selectedAddressSignal.set(address);
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
   * Create a new address
   */
  create(data: AddressRequest): Observable<AddressResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<AddressResponse>('/addresses', data).pipe(
      tap((address) => {
        this.addressesSignal.update((addresses) => [address, ...addresses]);
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
   * Update an existing address
   */
  update(id: number, data: AddressRequest): Observable<AddressResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<AddressResponse>(`/addresses/${id}`, data).pipe(
      tap((address) => {
        this.addressesSignal.update((addresses) =>
          addresses.map((a) => (a.id === id ? address : a)),
        );
        if (this.selectedAddressSignal()?.id === id) {
          this.selectedAddressSignal.set(address);
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
   * Delete an address (hard delete - remove from lists)
   */
  delete(id: number): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/addresses/${id}`).pipe(
      tap(() => {
        this.addressesSignal.update((addresses) => addresses.filter((a) => a.id !== id));

        this.globalActiveAddressesSignal.update((addresses) =>
          addresses.filter((address) => address.id !== id),
        );
        this.companyAddressesSignal.update((addresses) =>
          addresses.filter((address) => address.id !== id),
        );
        if (this.selectedAddressSignal()?.id === id) {
          this.selectedAddressSignal.set(null);
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
   * Deactivate an address (soft delete - keep item, set active=false)
   */
  deactivate(id: number): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/addresses/${id}/deactivate`, {}).pipe(
      tap(() => {
        this.updateAddressStatus(id, false);
      }),
      map(() => undefined),
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
   * Activate an address (set active=true)
   */
  activate(id: number): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/addresses/${id}/activate`, {}).pipe(
      tap(() => {
        this.updateAddressStatus(id, true);
      }),
      map(() => undefined),
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
   * Clear selected address
   */
  clearSelected(): void {
    this.selectedAddressSignal.set(null);
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
    return 'Erro ao processar endereço';
  }

  private updateAddressStatus(id: number, active: boolean): void {
    let updatedAddress: Address | null = null;

    this.addressesSignal.update((addresses) =>
      addresses.map((address) => {
        if (address.id !== id) return address;
        updatedAddress = { ...address, active };
        return updatedAddress;
      }),
    );

    if (!updatedAddress) return;
    const current = updatedAddress;

    if (active) {
      const existsInActive = this.globalActiveAddressesSignal().some(
        (address) => address.id === id,
      );
      this.globalActiveAddressesSignal.update((addresses) =>
        existsInActive
          ? addresses.map((address) => (address.id === id ? current : address))
          : [current, ...addresses],
      );
    } else {
      this.globalActiveAddressesSignal.update((addresses) =>
        addresses.filter((address) => address.id !== id),
      );
      this.companyAddressesSignal.update((addresses) =>
        addresses.filter((address) => address.id !== id),
      );
    }

    if (this.selectedAddressSignal()?.id === id) {
      this.selectedAddressSignal.set(current);
    }
  }
}
