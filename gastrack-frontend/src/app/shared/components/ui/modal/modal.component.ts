import { A11yModule } from '@angular/cdk/a11y';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

const modalVariants = cva(
  'flex flex-col max-h-[85vh] sm:max-h-[90vh] bg-card text-card-foreground rounded-sm shadow-lg animate-slideIn overflow-hidden',
  {
    variants: {
      size: {
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-2xl',
        xl: 'w-full max-w-4xl',
        full: 'w-full max-w-7xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type ModalSize = NonNullable<VariantProps<typeof modalVariants>['size']>;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-fadeIn"
        (click)="onBackdropClick($event)"
        role="presentation"
      >
        <div
          [class]="modalClasses()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title() ? titleId : null"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
        >
          <div
            class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0"
          >
            <h2 [id]="titleId" class="m-0 text-lg font-semibold text-card-foreground">
              {{ title() }}
            </h2>
            <button
              type="button"
              class="flex items-center justify-center p-1 text-muted-foreground transition-colors duration-150 rounded-md hover:text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              (click)="close()"
              aria-label="Close modal"
            >
              <svg
                class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 min-h-0 px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
            <ng-content />
          </div>

          <div
            class="flex gap-2 sm:gap-3 justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/50 shrink-0"
          >
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-1rem);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.15s ease-out;
    }

    .animate-slideIn {
      animation: slideIn 0.15s ease-out;
    }
  `,
})
export class ModalComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isOpen = input.required<boolean>();
  readonly title = input<string>('');
  readonly size = input<ModalSize>('md');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);
  readonly class = input<string>('');

  readonly closed = output();

  readonly titleId = `modal-title-${generateId()}`;

  private previouslyFocusedElement: HTMLElement | null = null;

  protected readonly modalClasses = computed(() =>
    cn(modalVariants({ size: this.size() }), this.class()),
  );

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (isPlatformBrowser(this.platformId)) {
        if (open) {
          this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
        } else if (this.previouslyFocusedElement) {
          this.previouslyFocusedElement.focus();
          this.previouslyFocusedElement = null;
        }
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen() && this.closeOnEscape()) {
      this.close();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      this.closeOnBackdrop() &&
      target.hasAttribute('role') &&
      target.getAttribute('role') === 'presentation'
    ) {
      this.close();
    }
  }

  protected close(): void {
    this.closed.emit();
  }
}
