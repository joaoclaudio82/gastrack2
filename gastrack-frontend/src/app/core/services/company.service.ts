import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type { Company, CompanyRequest, CompanyResponse } from '@models/company.model';
import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for company management (SUPER_ADMIN only)
 */
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly companiesSignal = signal<Company[]>([]);
  private readonly activeCompaniesSignal = signal<Company[]>([]);
  private readonly selectedCompanySignal = signal<Company | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private activeCompaniesFetchedAt: number | null = null;
  private static readonly ACTIVE_CACHE_MS = 60_000; // 1 minuto
  /** Página grande de propósito: o combo precisa da lista inteira, não das 20 mais recentes. */
  private static readonly ACTIVE_PAGE_SIZE = 100;

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
  readonly companies = this.companiesSignal.asReadonly();
  readonly activeCompanies = this.activeCompaniesSignal.asReadonly();
  readonly selectedCompany = this.selectedCompanySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signal for select options
  readonly companyOptions = computed(() =>
    this.activeCompaniesSignal().map((c) => ({
      label: c.name,
      value: c.id,
    })),
  );

  // Signal for search results (combobox)
  private readonly searchResultsSignal = signal<Company[]>([]);
  private readonly isSearchingSignal = signal<boolean>(false);
  readonly searchResults = this.searchResultsSignal.asReadonly();
  readonly isSearching = this.isSearchingSignal.asReadonly();
  readonly searchOptions = computed(() =>
    this.searchResultsSignal().map((c) => ({
      label: c.name,
      value: c.id,
    })),
  );

  /**
   * Fetch all companies with pagination
   */
  getAll(params?: PaginationParams): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Company>('/companies', params ?? { page: 1, pageSize: 10 })
      .pipe(
        tap((response) => {
          this.companiesSignal.set(response.items);
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
   * Fetch all active companies (for select dropdowns).
   * Usa cache de 1 minuto para evitar rate limit ao abrir/fechar modais rapidamente.
   *
   * `/companies/active` é paginado: sem `size` explícito o dropdown mostrava
   * só as 20 empresas mais recentes e omitia as demais em silêncio. Pede uma página grande e, se
   * ainda sobrarem páginas, busca o restante — nenhuma empresa ativa pode sumir do seletor.
   */
  getActive(forceRefresh = false): void {
    const now = Date.now();
    const cacheValid =
      this.activeCompaniesFetchedAt != null &&
      now - this.activeCompaniesFetchedAt < CompanyService.ACTIVE_CACHE_MS;

    if (!forceRefresh && cacheValid && this.activeCompaniesSignal().length > 0) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.fetchActivePage(0)
      .pipe(
        switchMap((first) => {
          const remainingPages = Array.from(
            { length: Math.max(0, first.totalPages - 1) },
            (_, index) => index + 1,
          );
          if (remainingPages.length === 0) {
            return of(first.content);
          }
          return forkJoin(remainingPages.map((page) => this.fetchActivePage(page))).pipe(
            map((pages) => [...first.content, ...pages.flatMap((page) => page.content)]),
          );
        }),
        tap((companies) => {
          this.activeCompaniesSignal.set(companies);
          this.activeCompaniesFetchedAt = Date.now();
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

  /** Uma página de `/companies/active`, normalizada — o endpoint pode responder lista ou `Page`. */
  private fetchActivePage(page: number): Observable<{ content: Company[]; totalPages: number }> {
    return this.api
      .get<
        Company[] | { content: Company[]; totalPages?: number }
      >('/companies/active', { page: String(page), size: String(CompanyService.ACTIVE_PAGE_SIZE) })
      .pipe(
        map((response) =>
          Array.isArray(response)
            ? { content: response, totalPages: 1 }
            : { content: response.content ?? [], totalPages: response.totalPages ?? 1 },
        ),
      );
  }

  /** Invalida o cache de empresas ativas (ex.: após criar nova empresa) */
  invalidateActiveCache(): void {
    this.activeCompaniesFetchedAt = null;
  }

  /**
   * Search active companies by name (server-side, for combobox)
   */
  searchActive(query: string): void {
    this.isSearchingSignal.set(true);

    const params = query ? { search: query, size: '20' } : { size: '20' };

    this.api
      .get<{ content: Company[] }>('/companies/active', params)
      .pipe(
        tap((response) => {
          const companies = Array.isArray(response) ? response : (response.content ?? []);
          this.searchResultsSignal.set(companies);
        }),
        catchError((error: unknown) => {
          this.searchResultsSignal.set([]);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isSearchingSignal.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Fetch company by ID
   */
  getById(id: string): Observable<CompanyResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<CompanyResponse>(`/companies/${id}`).pipe(
      tap((company) => {
        this.selectedCompanySignal.set(company);
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
   * Create a new company
   */
  create(data: CompanyRequest): Observable<CompanyResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<CompanyResponse>('/companies', data).pipe(
      tap((company) => {
        this.companiesSignal.update((companies) => [company, ...companies]);
        this.invalidateActiveCache();
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
   * Update an existing company
   */
  update(id: string, data: CompanyRequest): Observable<CompanyResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<CompanyResponse>(`/companies/${id}`, data).pipe(
      tap((company) => {
        this.companiesSignal.update((companies) =>
          companies.map((c) => (c.id === id ? company : c)),
        );
        if (this.selectedCompanySignal()?.id === id) {
          this.selectedCompanySignal.set(company);
        }
        this.invalidateActiveCache();
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
   * Delete a company
   */
  delete(id: string): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/companies/${id}`).pipe(
      tap(() => {
        this.companiesSignal.update((companies) => companies.filter((c) => c.id !== id));
        if (this.selectedCompanySignal()?.id === id) {
          this.selectedCompanySignal.set(null);
        }
        this.invalidateActiveCache();
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
   * Activate a company
   */
  activate(id: string): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<unknown>(`/companies/${id}/activate`, {}).pipe(
      tap(() => {
        this.updateCompanyStatus(id, true);
        this.invalidateActiveCache();
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
   * Deactivate a company
   */
  deactivate(id: string): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/companies/${id}`).pipe(
      tap(() => {
        this.updateCompanyStatus(id, false);
        this.invalidateActiveCache();
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
   * Clear selected company
   */
  clearSelected(): void {
    this.selectedCompanySignal.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  private updateCompanyStatus(id: string, active: boolean): void {
    let updatedCompany: Company | null = null;
    this.companiesSignal.update((companies) =>
      companies.map((company) => {
        if (company.id !== id) {
          return company;
        }
        updatedCompany = { ...company, active };
        return updatedCompany;
      }),
    );

    if (updatedCompany && this.selectedCompanySignal()?.id === id) {
      this.selectedCompanySignal.set(updatedCompany);
    }

    if (!updatedCompany) {
      return;
    }
    const current = updatedCompany;

    if (active) {
      const exists = this.activeCompaniesSignal().some((company) => company.id === id);
      if (exists) {
        this.activeCompaniesSignal.update((companies) =>
          companies.map((company) => (company.id === id ? current : company)),
        );
      } else {
        this.activeCompaniesSignal.update((companies) => [current, ...companies]);
      }
    } else {
      this.activeCompaniesSignal.update((companies) =>
        companies.filter((company) => company.id !== id),
      );
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) {
        return err.error.message;
      }
    }
    return 'Erro ao processar empresa';
  }
}
