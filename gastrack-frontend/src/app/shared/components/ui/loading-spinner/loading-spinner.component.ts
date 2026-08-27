import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    },
    variant: {
      primary: 'text-primary',
      secondary: 'text-muted-foreground',
      white: 'text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  },
});

const textVariants = cva('font-medium', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    },
    variant: {
      primary: 'text-foreground',
      secondary: 'text-muted-foreground',
      white: 'text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  },
});

type SpinnerSize = NonNullable<VariantProps<typeof spinnerVariants>['size']>;
type SpinnerVariant = NonNullable<VariantProps<typeof spinnerVariants>['variant']>;

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3"
      role="status"
      [attr.aria-label]="text() || 'Loading'"
    >
      <svg
        [class]="spinnerClasses()"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>

      @if (text()) {
        <span [class]="textClasses()">
          {{ text() }}
        </span>
      }

      @if (!text()) {
        <span class="sr-only">Loading...</span>
      }
    </div>
  `,
  styles: `
    .sr-only {
      position: absolute;
      margin: -1px;
      padding: 0;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border-width: 0;
      white-space: nowrap;
    }
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly variant = input<SpinnerVariant>('primary');
  readonly text = input<string>('');
  readonly class = input<string>('');

  protected readonly spinnerClasses = computed(() =>
    cn(spinnerVariants({ size: this.size(), variant: this.variant() }), this.class()),
  );

  protected readonly textClasses = computed(() =>
    cn(textVariants({ size: this.size(), variant: this.variant() })),
  );
}
