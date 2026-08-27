import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const alertVariants = cva('flex items-start gap-3 p-4 rounded-sm border', {
  variants: {
    variant: {
      info: 'bg-info/10 border-info/20 text-info',
      success: 'bg-success/10 border-success/20 text-success',
      warning: 'bg-warning/10 border-warning/20 text-warning-foreground',
      destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const iconColors: Record<string, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

const dismissButtonColors: Record<string, string> = {
  info: 'text-info hover:bg-info/20 focus:ring-info',
  success: 'text-success hover:bg-success/20 focus:ring-success',
  warning: 'text-warning hover:bg-warning/20 focus:ring-warning',
  destructive: 'text-destructive hover:bg-destructive/20 focus:ring-destructive',
};

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

@Component({
  selector: 'app-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!dismissed()) {
      <div [class]="containerClasses()" role="alert">
        @if (showIcon()) {
          <div class="flex-shrink-0" [innerHTML]="iconSvg()"></div>
        }

        <div class="flex-1">
          @if (title()) {
            <h3 [class]="titleClasses()">{{ title() }}</h3>
          }

          <div [class]="contentClasses()">
            <ng-content />
          </div>
        </div>

        @if (dismissible()) {
          <button
            type="button"
            class="flex-shrink-0 inline-flex rounded-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            [class]="dismissButtonClasses()"
            (click)="dismiss()"
            aria-label="Fechar alerta"
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        }
      </div>
    }
  `,
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('info');
  readonly title = input<string>('');
  readonly dismissible = input<boolean>(false);
  readonly showIcon = input<boolean>(true);
  readonly class = input<string>('');

  readonly dismissed = signal<boolean>(false);
  readonly dismissedChange = output();

  private readonly icons: Record<AlertVariant, string> = {
    info: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
    </svg>`,
    success: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>`,
    warning: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
    </svg>`,
    destructive: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
    </svg>`,
  };

  protected readonly containerClasses = computed(() =>
    cn(alertVariants({ variant: this.variant() }), this.class()),
  );

  protected readonly iconSvg = computed(() => {
    const colorClass = iconColors[this.variant()];
    return `<span class="${colorClass}">${this.icons[this.variant()]}</span>`;
  });

  protected readonly titleClasses = computed(() => cn('text-sm font-semibold'));

  protected readonly contentClasses = computed(() => cn('text-sm', this.title() ? 'mt-1' : ''));

  protected readonly dismissButtonClasses = computed(() => dismissButtonColors[this.variant()]);

  protected dismiss(): void {
    this.dismissed.set(true);
    this.dismissedChange.emit();
  }
}
