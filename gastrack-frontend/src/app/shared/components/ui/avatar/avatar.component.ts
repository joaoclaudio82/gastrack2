import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';

const avatarVariants = cva(
  'inline-flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-primary/70',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
      variant: {
        circle: 'rounded-full',
        rounded: 'rounded-sm',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'circle',
    },
  },
);

const textSizes: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const statusSizes: Record<string, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

const statusColors: Record<string, string> = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  busy: 'bg-destructive',
  away: 'bg-warning',
};

type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>['size']>;
type AvatarVariant = NonNullable<VariantProps<typeof avatarVariants>['variant']>;
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | null;

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-flex">
      <div [class]="containerClasses()">
        @if (src() && !hasError()) {
          <img
            [src]="src()"
            [alt]="alt()"
            class="h-full w-full object-cover"
            (error)="onImageError()"
          />
        } @else if (initials()) {
          <span [class]="initialsClasses()">{{ initials() }}</span>
        } @else {
          <svg
            class="h-[60%] w-[60%] text-primary-foreground"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
      </div>

      @if (status()) {
        <span [class]="statusClasses()" [attr.aria-label]="'Status: ' + status()"></span>
      }
    </div>
  `,
})
export class AvatarComponent {
  readonly src = input<string>('');
  readonly alt = input<string>('Avatar');
  readonly initials = input<string>('');
  readonly size = input<AvatarSize>('md');
  readonly variant = input<AvatarVariant>('circle');
  readonly status = input<AvatarStatus>(null);
  readonly class = input<string>('');

  protected readonly hasError = signal(false);

  protected readonly containerClasses = computed(() =>
    cn(avatarVariants({ size: this.size(), variant: this.variant() }), this.class()),
  );

  protected readonly initialsClasses = computed(() =>
    cn('font-medium text-primary-foreground uppercase', textSizes[this.size()]),
  );

  protected readonly statusClasses = computed(() => {
    const currentStatus = this.status();
    if (!currentStatus) return '';

    return cn(
      'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
      statusSizes[this.size()],
      statusColors[currentStatus],
    );
  });

  protected onImageError(): void {
    this.hasError.set(true);
  }
}
