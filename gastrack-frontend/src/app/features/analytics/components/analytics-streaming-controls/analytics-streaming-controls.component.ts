import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserPreferencesService } from '@core/services/user-preferences.service';
import {
  ANALYTICS_REFRESH_MAX_SECONDS,
  ANALYTICS_REFRESH_MIN_SECONDS,
} from '@models/user-preferences.model';

/**
 * Controls for the analytics streaming chart:
 * - range slider (1-30s) for refresh interval
 * - play/pause toggle for streaming
 * Reads from and writes to UserPreferencesService.
 */
@Component({
  selector: 'app-analytics-streaming-controls',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 min-w-0" role="group" aria-label="Controles de atualização">
      <button
        type="button"
        data-testid="pause-toggle"
        class="h-9 w-9 inline-flex items-center justify-center rounded-sm border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        [attr.aria-pressed]="prefs().analyticsStreamingPaused"
        [attr.aria-label]="
          prefs().analyticsStreamingPaused ? 'Retomar atualização' : 'Pausar atualização'
        "
        (click)="togglePause()"
      >
        @if (prefs().analyticsStreamingPaused) {
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        } @else {
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        }
      </button>

      <div class="flex flex-col gap-1 min-w-[180px]">
        <label
          for="analytics-refresh-slider"
          data-testid="interval-label"
          class="text-xs text-muted-foreground font-medium"
        >
          Atualização: {{ prefs().analyticsRefreshIntervalSeconds }}s
        </label>
        <input
          id="analytics-refresh-slider"
          type="range"
          [min]="min"
          [max]="max"
          step="1"
          [disabled]="prefs().analyticsStreamingPaused"
          [ngModel]="prefs().analyticsRefreshIntervalSeconds"
          (ngModelChange)="onIntervalChange($event)"
          aria-label="Intervalo de atualização em segundos"
          class="w-full h-2 bg-secondary rounded-sm accent-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>
    </div>
  `,
})
export class AnalyticsStreamingControlsComponent {
  private readonly service = inject(UserPreferencesService);

  protected readonly prefs = this.service.prefs;
  protected readonly min = ANALYTICS_REFRESH_MIN_SECONDS;
  protected readonly max = ANALYTICS_REFRESH_MAX_SECONDS;

  protected onIntervalChange(value: number | string): void {
    const seconds = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isFinite(seconds)) return;
    const clamped = Math.max(this.min, Math.min(this.max, seconds));
    this.service.update({ analyticsRefreshIntervalSeconds: clamped });
  }

  protected togglePause(): void {
    this.service.update({ analyticsStreamingPaused: !this.prefs().analyticsStreamingPaused });
  }
}
