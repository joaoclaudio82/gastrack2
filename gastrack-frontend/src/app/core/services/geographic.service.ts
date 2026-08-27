import { Injectable, computed, inject, signal } from '@angular/core';
import type { City, Country, State } from '@models/geographic.model';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for geographic data (countries, states, cities)
 */
@Injectable({ providedIn: 'root' })
export class GeographicService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly countriesSignal = signal<Country[]>([]);
  private readonly statesSignal = signal<State[]>([]);
  private readonly citiesSignal = signal<City[]>([]);
  private readonly citiesByStateCache = new Map<number, City[]>();
  private readonly citiesLoadedForStateSignal = signal<number | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  /** Emits when cities for a state are available (triggers recompute in components using getCityOptionsForState) */
  readonly citiesLoadedForState = this.citiesLoadedForStateSignal.asReadonly();

  // Public readonly signals
  readonly countries = this.countriesSignal.asReadonly();
  readonly states = this.statesSignal.asReadonly();
  readonly cities = this.citiesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals for select options
  readonly countryOptions = computed(() =>
    this.countriesSignal().map((c) => ({
      label: c.name,
      value: c.id,
    })),
  );

  readonly stateOptions = computed(() =>
    this.statesSignal().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  );

  readonly cityOptions = computed(() =>
    this.citiesSignal().map((c) => ({
      label: `${c.name} - ${c.stateAbbreviation}`,
      value: c.id,
    })),
  );

  /**
   * Fetch all countries
   */
  getCountries(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .get<Country[] | { content: Country[] }>('/countries')
      .pipe(
        tap((response) => {
          // Handle both array and paginated response formats
          const countries = Array.isArray(response) ? response : (response.content ?? []);
          this.countriesSignal.set(countries);
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
   * Fetch states by country ID
   */
  getStatesByCountry(countryId: number): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.statesSignal.set([]);
    this.citiesSignal.set([]);

    this.api
      .get<State[] | { content: State[] }>('/states', { countryId: String(countryId) })
      .pipe(
        tap((response) => {
          // Handle both array and paginated response formats
          const states = Array.isArray(response) ? response : (response.content ?? []);
          this.statesSignal.set(states);
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
   * Fetch cities by state ID. Caches results for use with multiple address forms.
   */
  getCitiesByState(stateId: number): void {
    const cached = this.citiesByStateCache.get(stateId);
    if (cached) {
      this.citiesSignal.set(cached);
      this.citiesLoadedForStateSignal.set(stateId);
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.citiesSignal.set([]);

    this.api
      .get<City[]>(`/cities/state/${stateId}`)
      .pipe(
        tap((cities) => {
          this.citiesByStateCache.set(stateId, cities);
          this.citiesSignal.set(cities);
          this.citiesLoadedForStateSignal.set(stateId);
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

  /** City options for a specific state (from cache). For use with multiple address forms. */
  getCityOptionsForState(stateId: number | null): { label: string; value: number }[] {
    if (!stateId) return [];
    const cities = this.citiesByStateCache.get(stateId) ?? [];
    return cities.map((c) => ({
      label: `${c.name} - ${c.stateAbbreviation}`,
      value: c.id,
    }));
  }

  /**
   * Search cities by name
   */
  searchCities(name: string, stateId?: number): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const params: Record<string, string> = { name };
    if (stateId) {
      params['stateId'] = String(stateId);
    }

    this.api
      .get<City[] | { content: City[] }>('/cities/search', params)
      .pipe(
        tap((response) => {
          // Handle both array and paginated response formats
          const cities = Array.isArray(response) ? response : (response.content ?? []);
          this.citiesSignal.set(cities);
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
   * Clear states and cities (useful when country changes)
   */
  clearStatesAndCities(): void {
    this.statesSignal.set([]);
    this.citiesSignal.set([]);
  }

  /**
   * Clear cities (useful when state changes)
   */
  clearCities(): void {
    this.citiesSignal.set([]);
  }

  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error?: { message?: string } };
      if (err.error?.message) {
        return err.error.message;
      }
    }
    return 'Erro ao carregar dados geográficos';
  }
}
