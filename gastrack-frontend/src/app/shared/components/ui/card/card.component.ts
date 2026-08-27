import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const cardVariants = cva(
  'overflow-hidden rounded-sm bg-card text-card-foreground transition-all duration-150',
  {
    variants: {
      variant: {
        default: 'shadow-sm border border-border',
        elevated: 'shadow-md border border-border',
        outline: 'border-2 border-border',
      },
      hoverable: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hoverable: 'false',
    },
    compoundVariants: [
      { variant: 'default', hoverable: 'true', class: 'hover:shadow-md' },
      { variant: 'elevated', hoverable: 'true', class: 'hover:shadow-lg' },
      { variant: 'outline', hoverable: 'true', class: 'hover:border-muted-foreground/50' },
    ],
  },
);

type CardVariant = NonNullable<VariantProps<typeof cardVariants>['variant']>;

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClasses()" role="article">
      @if (header()) {
        <div class="px-6 py-4 border-b border-border">
          <h3 class="m-0 text-lg font-semibold text-card-foreground">
            {{ header() }}
          </h3>
          @if (subheader()) {
            <p class="mt-1 mb-0 text-sm text-muted-foreground">
              {{ subheader() }}
            </p>
          }
        </div>
      }

      <div [class]="bodyClasses()">
        <ng-content />
      </div>

      @if (hasFooter) {
        <div class="px-6 py-4 bg-muted/50 border-t border-border">
          <ng-content select="[card-footer]" />
        </div>
      }
    </div>
  `,
})
export class CardComponent {
  readonly header = input<string>('');
  readonly subheader = input<string>('');
  readonly hoverable = input<boolean>(false);
  readonly noPadding = input<boolean>(false);
  readonly variant = input<CardVariant>('default');
  readonly class = input<string>('');

  protected hasFooter = false;

  protected readonly cardClasses = computed(() =>
    cn(
      cardVariants({
        variant: this.variant(),
        hoverable: this.hoverable() ? 'true' : 'false',
      }),
      this.class(),
    ),
  );

  protected readonly bodyClasses = computed(() => cn(this.noPadding() ? 'p-0' : 'p-6'));
}
