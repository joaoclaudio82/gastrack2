import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const progressVariants = cva('w-full rounded-full overflow-hidden', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const barVariants = cva('rounded-full transition-all duration-200', {
  variants: {
    variant: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    },
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

type ProgressVariant = NonNullable<VariantProps<typeof barVariants>['variant']>;
type ProgressSize = NonNullable<VariantProps<typeof progressVariants>['size']>;

@Component({
  selector: 'app-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (showLabel()) {
        <div class="flex justify-between mb-1">
          @if (label()) {
            <span class="text-sm font-medium text-foreground">{{ label() }}</span>
          }
          @if (!indeterminate()) {
            <span class="text-sm font-medium text-muted-foreground">{{ normalizedValue() }}%</span>
          }
        </div>
      }

      <div
        [class]="trackClasses()"
        role="progressbar"
        [attr.aria-valuenow]="indeterminate() ? null : normalizedValue()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="100"
      >
        <div [class]="barClasses()" [style.width]="barWidth()"></div>
      </div>
    </div>
  `,
  styles: `
    @keyframes indeterminate {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(400%);
      }
    }

    .animate-indeterminate {
      animation: indeterminate 1.5s ease-in-out infinite;
      width: 25%;
    }
  `,
})
export class ProgressComponent {
  readonly value = input<number>(0);
  readonly variant = input<ProgressVariant>('primary');
  readonly size = input<ProgressSize>('md');
  readonly showLabel = input<boolean>(false);
  readonly label = input<string>('');
  readonly indeterminate = input<boolean>(false);
  readonly class = input<string>('');

  protected readonly normalizedValue = computed(() => {
    const val = this.value();
    return Math.min(100, Math.max(0, val));
  });

  protected readonly trackClasses = computed(() =>
    cn(progressVariants({ size: this.size() }), 'bg-secondary', this.class()),
  );

  protected readonly barClasses = computed(() =>
    cn(
      barVariants({ variant: this.variant(), size: this.size() }),
      this.indeterminate() && 'animate-indeterminate',
    ),
  );

  protected readonly barWidth = computed(() => {
    if (this.indeterminate()) {
      return undefined;
    }
    return `${this.normalizedValue()}%`;
  });
}
