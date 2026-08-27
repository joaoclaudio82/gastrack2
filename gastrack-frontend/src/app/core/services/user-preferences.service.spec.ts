import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_USER_PREFERENCES } from '@models/user-preferences.model';
import { ConfigService } from './config.service';
import { NotificationService } from './notification.service';
import { UserPreferencesService } from './user-preferences.service';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let http: HttpTestingController;
  let notification: NotificationService;
  const baseUrl = 'http://test/api/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: baseUrl } },
        UserPreferencesService,
      ],
    });
    service = TestBed.inject(UserPreferencesService);
    http = TestBed.inject(HttpTestingController);
    notification = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    http.verify();
  });

  it('starts with default prefs', () => {
    expect(service.prefs()).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('load() populates signal from GET response', () => {
    service.load().subscribe();

    const req = http.expectOne(`${baseUrl}/users/me/preferences`);
    expect(req.request.method).toBe('GET');
    req.flush({ analyticsRefreshIntervalSeconds: 12, analyticsStreamingPaused: true });

    expect(service.prefs()).toEqual({
      analyticsRefreshIntervalSeconds: 12,
      analyticsStreamingPaused: true,
    });
  });

  it('update() optimistically mutates signal immediately', () => {
    service.update({ analyticsRefreshIntervalSeconds: 20 });
    expect(service.prefs().analyticsRefreshIntervalSeconds).toBe(20);
  });

  it('update() debounces PUT requests (500ms)', () => {
    vi.useFakeTimers();
    try {
      service.update({ analyticsRefreshIntervalSeconds: 10 });
      service.update({ analyticsRefreshIntervalSeconds: 15 });
      service.update({ analyticsRefreshIntervalSeconds: 20 });

      vi.advanceTimersByTime(499);
      // no PUT yet — debounce not elapsed
      vi.advanceTimersByTime(1);

      const req = http.expectOne(`${baseUrl}/users/me/preferences`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        analyticsRefreshIntervalSeconds: 20,
        analyticsStreamingPaused: false,
      });
      req.flush({ analyticsRefreshIntervalSeconds: 20, analyticsStreamingPaused: false });
    } finally {
      vi.useRealTimers();
    }
  });

  it('update() rolls back signal and shows error notification when PUT fails', () => {
    service.load().subscribe();
    http
      .expectOne(`${baseUrl}/users/me/preferences`)
      .flush({ analyticsRefreshIntervalSeconds: 5, analyticsStreamingPaused: false });

    const spy = vi.spyOn(notification, 'error');

    vi.useFakeTimers();
    try {
      service.update({ analyticsRefreshIntervalSeconds: 25 });
      expect(service.prefs().analyticsRefreshIntervalSeconds).toBe(25);

      vi.advanceTimersByTime(500);
      const req = http.expectOne(`${baseUrl}/users/me/preferences`);
      req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

      expect(service.prefs().analyticsRefreshIntervalSeconds).toBe(5);
      expect(spy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
