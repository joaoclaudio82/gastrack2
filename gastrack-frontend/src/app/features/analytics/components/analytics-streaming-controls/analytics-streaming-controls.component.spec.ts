import { provideZonelessChangeDetection, signal, type Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserPreferencesService } from '@core/services/user-preferences.service';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@models/user-preferences.model';
import { AnalyticsStreamingControlsComponent } from './analytics-streaming-controls.component';

interface StubService {
  prefs: Signal<UserPreferences>;
  update: ReturnType<typeof vi.fn>;
}

describe('AnalyticsStreamingControlsComponent', () => {
  let fixture: ComponentFixture<AnalyticsStreamingControlsComponent>;
  let service: StubService;
  let host: HTMLElement;

  beforeEach(async () => {
    const prefsSignal = signal<UserPreferences>({ ...DEFAULT_USER_PREFERENCES });
    const updateSpy = vi.fn((partial: Partial<UserPreferences>) => {
      prefsSignal.update((p) => ({ ...p, ...partial }));
    });
    service = {
      prefs: prefsSignal.asReadonly(),
      update: updateSpy,
    };

    await TestBed.configureTestingModule({
      imports: [AnalyticsStreamingControlsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: UserPreferencesService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsStreamingControlsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders current interval in the label', () => {
    const label = host.querySelector('[data-testid="interval-label"]');
    expect(label?.textContent).toContain('5');
    expect(label?.textContent).toContain('s');
  });

  it('slider change calls update with new interval', () => {
    const slider = host.querySelector<HTMLInputElement>('input[type="range"]');
    if (!slider) throw new Error('slider not rendered');
    slider.value = '15';
    slider.dispatchEvent(new Event('input'));
    slider.dispatchEvent(new Event('change'));
    expect(service.update).toHaveBeenCalledWith({ analyticsRefreshIntervalSeconds: 15 });
  });

  it('pause toggle flips the paused flag', () => {
    const button = host.querySelector<HTMLButtonElement>('[data-testid="pause-toggle"]');
    if (!button) throw new Error('toggle button not rendered');
    button.click();
    expect(service.update).toHaveBeenCalledWith({ analyticsStreamingPaused: true });
  });
});
