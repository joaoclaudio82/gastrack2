import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  fromSpringBootPage,
  PaginatedResponse,
  PaginationParams,
  SpringBootPageResponse,
  toSpringBootParams,
} from '@models/api-response.model';
import { map, Observable } from 'rxjs';
import { ConfigService } from './config.service';

/**
 * Base API service for HTTP operations with Spring Boot backend.
 * Provides typed methods for CRUD operations and pagination support.
 *
 * Usage:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class CylinderService {
 *   private readonly api = inject(ApiService);
 *
 *   getAll(params: PaginationParams): Observable<PaginatedResponse<Cylinder>> {
 *     return this.api.getPaginated<Cylinder>('/cylinders', params);
 *   }
 *
 *   getById(id: number): Observable<Cylinder> {
 *     return this.api.get<Cylinder>(`/cylinders/${id}`);
 *   }
 *
 *   create(data: CreateCylinderRequest): Observable<Cylinder> {
 *     return this.api.post<Cylinder>('/cylinders', data);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get baseUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    if (params) {
      const httpParams = new HttpParams({ fromObject: params });
      return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams });
    }
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  /**
   * GET paginated request - automatically converts Spring Boot Page<T> to PaginatedResponse<T>
   * Supports additional filters via the extraParams object
   */
  getPaginated<T>(
    endpoint: string,
    params: PaginationParams,
    extraParams?: Record<string, string | number | boolean>,
  ): Observable<PaginatedResponse<T>> {
    const springParams = toSpringBootParams(params);
    // Add any extra params
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value !== undefined && value !== null) {
          springParams[key] = String(value);
        }
      }
    }
    const httpParams = new HttpParams({ fromObject: springParams });
    return this.http
      .get<SpringBootPageResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(map((response) => fromSpringBootPage(response)));
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
