import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide uppercase ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground ring-border',
        success:
          'bg-[var(--color-success-bg)] text-[var(--color-success-text)] ring-[var(--color-success)]/30',
        warning:
          'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] ring-[var(--color-warning)]/30',
        destructive:
          'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] ring-[var(--color-danger)]/30',
        info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] ring-[var(--color-info)]/30',
        primary: 'bg-primary/10 text-primary ring-primary/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-[11px]',
        lg: 'px-3 py-1.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const dotVariants = cva('inline-flex rounded-full animate-pulse', {
  variants: {
    variant: {
      default: 'bg-muted-foreground',
      success: 'bg-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)]',
      destructive: 'bg-[var(--color-danger)]',
      info: 'bg-[var(--color-info)]',
      primary: 'bg-primary',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>;

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()" [attr.aria-label]="ariaLabel() || null">
      @if (showDot()) {
        <span [class]="dotClasses()" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('sm');
  readonly showDot = input<boolean>(true);
  readonly ariaLabel = input<string>('');
  readonly class = input<string>('');

  protected readonly badgeClasses = computed(() =>
    cn(badgeVariants({ variant: this.variant(), size: this.size() }), this.class()),
  );

  protected readonly dotClasses = computed(() =>
    cn(dotVariants({ variant: this.variant(), size: this.size() })),
  );
}
