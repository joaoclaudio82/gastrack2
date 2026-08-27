import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ActivityVariant = 'success' | 'info' | 'primary' | 'warning' | 'default';

@Component({
  selector: 'app-activity-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li [class]="itemClasses()" role="listitem">
      <div class="flex items-start gap-4">
        <div [class]="iconClasses()" aria-hidden="true">
          <ng-content select="[activity-icon]" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-foreground">{{ title() }}</p>

          <div class="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            <ng-content select="[activity-description]" />
          </div>

          @if (timestampLabel()) {
            <time
              class="text-xs font-medium text-muted-foreground/70 mt-2 inline-block"
              [attr.datetime]="timestamp()"
            >
              {{ timestampLabel() }}
            </time>
          }
        </div>
      </div>
    </li>
  `,
})
export class ActivityItemComponent {
  readonly title = input<string>('');
  readonly timestamp = input<string>('');
  readonly timestampLabel = input<string>('');
  readonly variant = input<ActivityVariant>('success');
  readonly interactive = input<boolean>(true);

  private readonly variantClasses: Record<ActivityVariant, string[]> = {
    success: [
      'bg-[var(--color-success-bg)]',
      'text-[var(--color-success-text)]',
      'ring-[var(--color-success)]/30',
    ],
    info: [
      'bg-[var(--color-info-bg)]',
      'text-[var(--color-info-text)]',
      'ring-[var(--color-info)]/30',
    ],
    primary: ['bg-primary/10', 'text-primary', 'ring-primary/30'],
    warning: [
      'bg-[var(--color-warning-bg)]',
      'text-[var(--color-warning-text)]',
      'ring-[var(--color-warning)]/30',
    ],
    default: ['bg-secondary', 'text-secondary-foreground', 'ring-border'],
  };

  protected readonly itemClasses = computed(() => {
    const base = ['px-6 py-5'];

    if (this.interactive()) {
      base.push('transition-colors duration-100', 'hover:bg-accent', 'focus-within:bg-accent');
    }

    return base.join(' ');
  });

  protected readonly iconClasses = computed(() => {
    return [
      'flex items-center justify-center w-11 h-11 rounded-sm flex-shrink-0',
      'ring-1',
      ...this.variantClasses[this.variant()],
    ].join(' ');
  });
}
