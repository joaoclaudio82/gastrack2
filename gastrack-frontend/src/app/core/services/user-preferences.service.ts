import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@models/user-preferences.model';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { ConfigService } from './config.service';
import { NotificationService } from './notification.service';

/**
 * Manages the authenticated user's application preferences.
 * - Holds an authoritative signal populated on bootstrap via `load()`.
 * - `update(partial)` applies an optimistic mutation and persists via PUT with a 500ms debounce.
 * - On persistence failure, rolls back the signal and surfaces a toast via NotificationService.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly notification = inject(NotificationService);

  private readonly prefsSignal = signal<UserPreferences>(DEFAULT_USER_PREFERENCES);
  readonly prefs = this.prefsSignal.asReadonly();

  private readonly pendingUpdate$ = new Subject<UserPreferences>();
  private snapshotBeforeUpdate: UserPreferences = DEFAULT_USER_PREFERENCES;

  constructor() {
    this.pendingUpdate$
      .pipe(
        debounceTime(500),
        switchMap((payload) =>
          this.http.put<UserPreferences>(this.endpoint, payload).pipe(
            catchError(() => {
              this.prefsSignal.set(this.snapshotBeforeUpdate);
              this.notification.error('Não foi possível salvar sua preferência.');
              return of(null);
            }),
          ),
        ),
      )
      .subscribe((response) => {
        if (response) {
          this.prefsSignal.set(response);
          this.snapshotBeforeUpdate = response;
        }
      });
  }

  load(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.endpoint).pipe(
      tap((prefs) => {
        this.prefsSignal.set(prefs);
        this.snapshotBeforeUpdate = prefs;
      }),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  update(partial: Partial<UserPreferences>): void {
    this.snapshotBeforeUpdate = this.prefsSignal();
    const next: UserPreferences = { ...this.prefsSignal(), ...partial };
    this.prefsSignal.set(next);
    this.pendingUpdate$.next(next);
  }

  private get endpoint(): string {
    return `${this.config.apiUrl}/users/me/preferences`;
  }
}
