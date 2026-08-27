import { Injectable, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type { User } from '@models/auth.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Extended user interface for listing
 */
export interface UserListItem extends User {
  active: boolean;
  lastLoginAt?: string;
  companyName?: string;
  role?: string;
}

/**
 * Service for user management (admin operations)
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly usersSignal = signal<UserListItem[]>([]);
  private readonly selectedUserSignal = signal<UserListItem | null>(null);
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
  readonly users = this.usersSignal.asReadonly();
  readonly selectedUser = this.selectedUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  /**
   * Fetch all users with pagination (filtered by tenant automatically on backend)
   */
  getAll(params?: PaginationParams & { role?: string; companyId?: string }): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const { role, companyId, ...paginationParams } = params ?? {
      page: 1,
      pageSize: 10,
    };

    const filters: Record<string, string> = {};
    if (role) {
      filters['role'] = role;
    }
    if (companyId) {
      filters['companyId'] = companyId;
    }

    this.api
      .getPaginated<UserListItem>('/users', paginationParams, filters)
      .pipe(
        tap((response) => {
          this.usersSignal.set(response.items);
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
   * Fetch user by ID
   */
  getById(id: string): Observable<UserListItem> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<UserListItem>(`/users/${id}`).pipe(
      tap((user) => {
        this.selectedUserSignal.set(user);
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
   * Deactivate a user
   */
  deactivate(id: string): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/users/${id}`).pipe(
      tap(() => {
        this.usersSignal.update((users) =>
          users.map((u) => (u.id === id ? { ...u, active: false } : u)),
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
   * Activate a user
   */
  activate(id: string): Observable<UserListItem> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<UserListItem>(`/users/${id}/activate`, {}).pipe(
      tap((user) => {
        this.usersSignal.update((users) => users.map((u) => (u.id === id ? user : u)));
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
   * Clear selected user
   */
  clearSelected(): void {
    this.selectedUserSignal.set(null);
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
    return 'Erro ao processar usuário';
  }
}
