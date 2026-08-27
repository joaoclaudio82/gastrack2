import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const dividerVariants = cva('border-border', {
  variants: {
    variant: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
    orientation: {
      horizontal: 'border-t w-full',
      vertical: 'border-l h-full',
    },
  },
  defaultVariants: {
    variant: 'solid',
    orientation: 'horizontal',
  },
});

type DividerVariant = NonNullable<VariantProps<typeof dividerVariants>['variant']>;
type DividerOrientation = NonNullable<VariantProps<typeof dividerVariants>['orientation']>;

@Component({
  selector: 'app-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (orientation() === 'horizontal') {
      <div [class]="containerClasses()">
        @if (label()) {
          <div [class]="lineClasses()"></div>
          <span class="px-3 text-sm text-muted-foreground bg-background">{{ label() }}</span>
          <div [class]="lineClasses()"></div>
        } @else {
          <div [class]="fullLineClasses()"></div>
        }
      </div>
    } @else {
      <div [class]="verticalClasses()"></div>
    }
  `,
})
export class DividerComponent {
  readonly orientation = input<DividerOrientation>('horizontal');
  readonly label = input<string>('');
  readonly variant = input<DividerVariant>('solid');
  readonly class = input<string>('');

  protected readonly containerClasses = computed(() =>
    cn(this.label() ? 'flex items-center w-full' : 'w-full', this.class()),
  );

  protected readonly lineClasses = computed(() =>
    cn('flex-1 border-t border-border', dividerVariants({ variant: this.variant() })),
  );

  protected readonly fullLineClasses = computed(() =>
    cn(dividerVariants({ variant: this.variant(), orientation: 'horizontal' })),
  );

  protected readonly verticalClasses = computed(() =>
    cn(dividerVariants({ variant: this.variant(), orientation: 'vertical' }), this.class()),
  );
}
