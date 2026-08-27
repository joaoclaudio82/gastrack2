import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type StatCardVariant = 'info' | 'success' | 'primary' | 'warning' | 'destructive' | 'default';
type TrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article [class]="cardClasses()" role="listitem">
      <div class="flex items-center justify-between mb-4">
        <div [class]="iconWrapperClasses()" aria-hidden="true">
          <ng-content select="[stat-icon]" />
        </div>

        @if (trendValue()) {
          <span [class]="trendClasses()" [attr.aria-label]="trendLabel() || 'Tendência'">
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              @switch (trendDirection()) {
                @case ('up') {
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                }
                @case ('down') {
                  <polyline points="1 18 8.5 9.5 13.5 14.5 23 6" />
                  <polyline points="17 18 23 18 23 12" />
                }
                @default {
                  <line x1="4" y1="12" x2="20" y2="12" />
                }
              }
            </svg>
            {{ trendValue() }}
          </span>
        }
      </div>

      <div>
        <p class="text-4xl font-bold text-foreground tabular-nums">{{ value() }}</p>
        <p class="text-sm font-medium text-muted-foreground mt-2">{{ label() }}</p>

        @if (description()) {
          <p class="text-xs text-muted-foreground/70 mt-1">{{ description() }}</p>
        }
      </div>
    </article>
  `,
})
export class StatCardComponent {
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly value = input<string | number>('');
  readonly variant = input<StatCardVariant>('default');
  readonly interactive = input<boolean>(true);
  readonly trendValue = input<string>('');
  readonly trendLabel = input<string>('');
  readonly trendDirection = input<TrendDirection>('up');

  private readonly variantClasses: Record<StatCardVariant, string[]> = {
    info: [
      'bg-[var(--color-info-bg)]',
      'text-[var(--color-info-text)]',
      'ring-[var(--color-info)]/30',
    ],
    success: [
      'bg-[var(--color-success-bg)]',
      'text-[var(--color-success-text)]',
      'ring-[var(--color-success)]/30',
    ],
    primary: ['bg-primary/10', 'text-primary', 'ring-primary/30'],
    warning: [
      'bg-[var(--color-warning-bg)]',
      'text-[var(--color-warning-text)]',
      'ring-[var(--color-warning)]/30',
    ],
    destructive: [
      'bg-[var(--color-danger-bg)]',
      'text-[var(--color-danger-text)]',
      'ring-[var(--color-danger)]/30',
    ],
    default: ['bg-secondary', 'text-secondary-foreground', 'ring-border'],
  };

  private readonly trendVariantClasses: Record<TrendDirection, string[]> = {
    up: ['text-[var(--color-success-text)]', 'bg-[var(--color-success-bg)]'],
    down: ['text-[var(--color-danger-text)]', 'bg-[var(--color-danger-bg)]'],
    neutral: ['text-secondary-foreground', 'bg-secondary'],
  };

  protected readonly cardClasses = computed(() => {
    const base = [
      'bg-card',
      'rounded-sm',
      'border border-border',
      'p-6',
      'shadow-sm',
      'transition-all duration-150',
    ];

    if (this.interactive()) {
      base.push(
        'hover:shadow-lg',
        'hover:border-primary/50',
        'focus-within:ring-2',
        'focus-within:ring-ring/50',
      );
    }

    return base.join(' ');
  });

  protected readonly iconWrapperClasses = computed(() => {
    return [
      'flex items-center justify-center w-12 h-12 rounded-sm',
      'ring-1',
      ...this.variantClasses[this.variant()],
    ].join(' ');
  });

  protected readonly trendClasses = computed(() => {
    return [
      'inline-flex items-center gap-1',
      'text-sm font-semibold',
      'px-2 py-1 rounded-md',
      ...this.trendVariantClasses[this.trendDirection()],
    ].join(' ');
  });
}
