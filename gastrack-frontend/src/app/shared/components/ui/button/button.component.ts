import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 font-medium rounded-sm border transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-primary border-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
        secondary: 'bg-secondary border-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
        outline:
          'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost:
          'border-transparent bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'border-transparent bg-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      [attr.aria-busy]="loading()"
      [attr.aria-disabled]="disabled() || loading()"
      (click)="onClick($event)"
    >
      <span [class]="contentClasses()">
        <ng-content />
      </span>
      @if (loading()) {
        <span
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            class="animate-spin text-current"
            [class]="spinnerSizeClasses()"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        </span>
      }
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input<boolean>(false);
  readonly class = input<string>('');

  readonly buttonClick = output<MouseEvent>();

  protected readonly buttonClasses = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this.fullWidth() && 'w-full',
      this.class(),
    ),
  );

  protected readonly spinnerSizeClasses = computed(() => {
    const sizes: Record<ButtonSize, string> = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      icon: 'h-4 w-4',
    };
    return sizes[this.size()];
  });

  protected readonly contentClasses = computed(() =>
    cn('inline-flex items-center whitespace-nowrap', this.loading() ? 'opacity-0' : 'opacity-100'),
  );

  protected onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.buttonClick.emit(event);
    }
  }
}
