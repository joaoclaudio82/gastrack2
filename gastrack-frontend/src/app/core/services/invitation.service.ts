import { Injectable, computed, inject, signal } from '@angular/core';
import type { PaginationParams } from '@models/api-response.model';
import type {
  CreateInvitationRequest,
  Invitation,
  InvitationResponse,
} from '@models/invitation.model';
import { InvitationStatus } from '@models/invitation.model';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Service for invitation management
 */
@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly api = inject(ApiService);

  // Private writable signals
  private readonly invitationsSignal = signal<Invitation[]>([]);
  private readonly selectedInvitationSignal = signal<Invitation | null>(null);
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
  readonly invitations = this.invitationsSignal.asReadonly();
  readonly selectedInvitation = this.selectedInvitationSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  // Computed signals
  readonly pendingCount = computed(
    () => this.invitationsSignal().filter((i) => i.status === InvitationStatus.PENDING).length,
  );

  readonly pendingInvitations = computed(() =>
    this.invitationsSignal().filter((i) => i.status === InvitationStatus.PENDING),
  );

  /**
   * Fetch all invitations with pagination and optional status filter
   */
  getAll(params?: PaginationParams, filters?: { status?: InvitationStatus | null }): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.api
      .getPaginated<Invitation>(
        '/admin/invites',
        params ?? { page: 1, pageSize: 10 },
        this.buildFilterParams(filters),
      )
      .pipe(
        tap((response) => {
          this.invitationsSignal.set(response.items);
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
   * Fetch invitation by ID
   */
  getById(id: string): Observable<InvitationResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<InvitationResponse>(`/admin/invites/${id}`).pipe(
      tap((invitation) => {
        this.selectedInvitationSignal.set(invitation);
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
   * Create a new invitation
   */
  create(data: CreateInvitationRequest): Observable<InvitationResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<InvitationResponse>('/admin/invites', data).pipe(
      tap((invitation) => {
        this.invitationsSignal.update((invitations) => [invitation, ...invitations]);
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
   * Cancel an invitation
   */
  cancel(id: string): Observable<unknown> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<unknown>(`/admin/invites/${id}`).pipe(
      tap(() => {
        this.invitationsSignal.update((invitations) =>
          invitations.map((i) => (i.id === id ? { ...i, status: InvitationStatus.CANCELLED } : i)),
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
   * Resend an invitation
   */
  resend(id: string): Observable<InvitationResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<InvitationResponse>(`/admin/invites/${id}/resend`, {}).pipe(
      tap((invitation) => {
        this.invitationsSignal.update((invitations) =>
          invitations.map((i) => (i.id === id ? invitation : i)),
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
   * Clear selected invitation
   */
  clearSelected(): void {
    this.selectedInvitationSignal.set(null);
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
    return 'Erro ao processar convite';
  }

  private buildFilterParams(filters?: { status?: InvitationStatus | null }) {
    if (!filters) {
      return {};
    }
    const params: Record<string, string> = {};
    if (filters.status) {
      params['status'] = filters.status;
    }
    return params;
  }
}
