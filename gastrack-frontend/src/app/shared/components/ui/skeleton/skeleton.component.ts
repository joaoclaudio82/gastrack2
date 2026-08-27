import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const skeletonVariants = cva('bg-muted relative overflow-hidden', {
  variants: {
    variant: {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-sm',
    },
    animation: {
      pulse: 'animate-pulse',
      wave: '',
      none: '',
    },
  },
  defaultVariants: {
    variant: 'text',
    animation: 'pulse',
  },
});

type SkeletonVariant = NonNullable<VariantProps<typeof skeletonVariants>['variant']>;
type SkeletonAnimation = NonNullable<VariantProps<typeof skeletonVariants>['animation']>;

const defaultHeights: Record<SkeletonVariant, string> = {
  text: '1rem',
  circular: '40px',
  rectangular: '100px',
};

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="skeletonClasses()" [style]="styleObject()" aria-hidden="true">
      @if (animation() === 'wave') {
        <div
          class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background/40 to-transparent animate-wave"
        ></div>
      }
    </div>
  `,
  styles: `
    @keyframes wave {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .animate-wave {
      animation: wave 1.5s infinite;
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('text');
  readonly width = input<string>('100%');
  readonly height = input<string>('');
  readonly animation = input<SkeletonAnimation>('pulse');
  readonly class = input<string>('');

  protected readonly skeletonClasses = computed(() =>
    cn(skeletonVariants({ variant: this.variant(), animation: this.animation() }), this.class()),
  );

  protected readonly styleObject = computed(() => {
    const currentVariant = this.variant();
    const height = this.height() || defaultHeights[currentVariant];
    const width = this.width();

    if (currentVariant === 'circular') {
      const size = height;
      return {
        width: size,
        height: size,
      };
    }

    return {
      width,
      height,
    };
  });
}
