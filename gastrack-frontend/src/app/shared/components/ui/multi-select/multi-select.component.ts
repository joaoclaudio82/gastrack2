import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

export interface MultiSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean | undefined;
  description?: string | undefined;
}

const selectTriggerVariants = cva(
  'relative flex w-full items-center justify-between rounded-sm border bg-background text-foreground shadow-sm transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'min-h-8 px-3 text-sm gap-2',
        md: 'min-h-10 px-4 text-sm gap-2',
        lg: 'min-h-12 px-4 text-base gap-3',
      },
      state: {
        default: 'border-input hover:border-muted-foreground/50',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
        disabled: 'cursor-not-allowed bg-muted text-muted-foreground',
        open: 'border-primary ring-2 ring-ring/50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

type MultiSelectSize = NonNullable<VariantProps<typeof selectTriggerVariants>['size']>;

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex flex-col gap-1.5" [class]="class()">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [for]="selectId()">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-destructive" aria-label="required">*</span>
          }
        </label>
      }

      <!-- Selected Items Display -->
      @if (value().length > 0) {
        <div class="flex flex-wrap gap-2 mb-2">
          @for (val of value(); track val) {
            <div
              class="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2.5 py-1 text-sm text-primary border border-primary/20"
            >
              <span class="max-w-[200px] truncate">{{ getOptionLabel(val) }}</span>
              <button
                type="button"
                class="rounded-full p-0.5 hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                [attr.aria-label]="'Remover ' + getOptionLabel(val)"
                (click)="removeValue(val)"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
        </div>
      }

      <div class="relative">
        <!-- Trigger Button -->
        <button
          #triggerBtn
          type="button"
          role="combobox"
          cdkOverlayOrigin
          #trigger="cdkOverlayOrigin"
          [id]="selectId()"
          [disabled]="disabled()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'listbox'"
          [attr.aria-controls]="listboxId()"
          [attr.aria-invalid]="error() ? 'true' : 'false'"
          [attr.aria-describedby]="describedBy()"
          [class]="triggerClasses()"
          (click)="toggle()"
          (keydown)="onKeydown($event)"
        >
          <span class="flex items-center gap-2">
            <svg
              class="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span class="text-muted-foreground">
              {{ addMoreLabel() }}
            </span>
          </span>
          <div class="flex items-center gap-2">
            @if (value().length > 0) {
              <span class="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {{ value().length }}
              </span>
            }
            <svg
              class="h-4 w-4 text-muted-foreground transition-transform duration-150"
              [class.rotate-180]="isOpen()"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </button>

        <!-- Dropdown (CDK Overlay) -->
        <ng-template
          cdkConnectedOverlay
          [cdkConnectedOverlayOrigin]="trigger"
          [cdkConnectedOverlayOpen]="isOpen()"
          [cdkConnectedOverlayHasBackdrop]="true"
          [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
          [cdkConnectedOverlayMinWidth]="triggerWidth()"
          (backdropClick)="close()"
        >
          <div
            role="listbox"
            [id]="listboxId()"
            [attr.aria-labelledby]="selectId()"
            [attr.aria-multiselectable]="'true'"
            class="w-full max-h-60 overflow-auto rounded-sm border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          >
            @for (option of availableOptions(); track option.value; let i = $index) {
              <button
                type="button"
                role="option"
                [attr.aria-selected]="isSelected(option)"
                [disabled]="option.disabled"
                class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors"
                [class.bg-accent]="focusedIndex() === i"
                [class.text-accent-foreground]="focusedIndex() === i"
                [class.hover:bg-accent]="!option.disabled"
                [class.hover:text-accent-foreground]="!option.disabled"
                [class.opacity-50]="option.disabled"
                [class.cursor-not-allowed]="option.disabled"
                (click)="selectOption(option)"
                (mouseenter)="focusedIndex.set(i)"
              >
                <div class="flex-1 text-left">
                  <div>{{ option.label }}</div>
                  @if (option.description) {
                    <div class="text-xs text-muted-foreground">{{ option.description }}</div>
                  }
                </div>
              </button>
            } @empty {
              <div class="px-3 py-2 text-sm text-muted-foreground text-center">
                {{ emptyMessage() }}
              </div>
            }
          </div>
        </ng-template>
      </div>

      <div class="min-h-[18px]">
        @if (error()) {
          <span
            [id]="selectId() + '-error'"
            class="text-xs text-destructive flex items-center gap-1"
            role="alert"
          >
            <svg
              class="h-3.5 w-3.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            {{ error() }}
          </span>
        } @else if (hint()) {
          <span [id]="selectId() + '-hint'" class="text-xs text-muted-foreground">
            {{ hint() }}
          </span>
        }
      </div>
    </div>
  `,
  styles: `
    @keyframes fade-in-0 {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes zoom-in-95 {
      from {
        transform: scale(0.95);
      }
      to {
        transform: scale(1);
      }
    }
    @keyframes slide-in-from-top-2 {
      from {
        transform: translateY(-8px);
      }
      to {
        transform: translateY(0);
      }
    }
    .animate-in {
      animation:
        fade-in-0 150ms ease-out,
        zoom-in-95 150ms ease-out,
        slide-in-from-top-2 150ms ease-out;
    }
  `,
})
export class MultiSelectComponent {
  // Inputs
  readonly label = input<string>('');
  readonly addMoreLabel = input<string>('Adicionar item');
  readonly emptyMessage = input<string>('Nenhuma opção disponível');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly options = input<MultiSelectOption[]>([]);
  readonly selectId = input<string>(`multi-select-${generateId()}`);
  readonly size = input<MultiSelectSize>('md');
  readonly class = input<string>('');
  readonly hideSelected = input<boolean>(true);

  // Two-way binding with model
  readonly value = model<(string | number)[]>([]);

  // Outputs
  readonly itemAdded = output<string | number>();
  readonly itemRemoved = output<string | number>();

  // Internal state
  protected readonly isOpen = signal(false);
  protected readonly focusedIndex = signal(-1);
  protected readonly triggerWidth = signal(0);

  private readonly triggerElement = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');

  // Computed
  protected readonly listboxId = computed(() => `${this.selectId()}-listbox`);

  protected readonly availableOptions = computed(() => {
    if (!this.hideSelected()) {
      return this.options();
    }
    const selected = new Set(this.value());
    return this.options().filter((opt) => !selected.has(opt.value));
  });

  protected readonly triggerClasses = computed(() => {
    let state: 'default' | 'error' | 'disabled' | 'open' = 'default';
    if (this.error()) state = 'error';
    else if (this.disabled()) state = 'disabled';
    else if (this.isOpen()) state = 'open';
    return cn(selectTriggerVariants({ size: this.size(), state }));
  });

  protected readonly describedBy = computed(() => {
    if (this.error()) return `${this.selectId()}-error`;
    if (this.hint()) return `${this.selectId()}-hint`;
    return null;
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected open(): void {
    if (this.disabled()) return;
    const trigger = this.triggerElement()?.nativeElement;
    if (trigger) {
      this.triggerWidth.set(trigger.offsetWidth);
    }
    this.isOpen.set(true);
    this.focusedIndex.set(this.availableOptions().length > 0 ? 0 : -1);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  protected selectOption(option: MultiSelectOption): void {
    if (option.disabled) return;

    const currentValues = this.value();
    if (!currentValues.includes(option.value)) {
      this.value.set([...currentValues, option.value]);
      this.itemAdded.emit(option.value);
    }

    if (this.availableOptions().length <= 1) {
      this.close();
    } else {
      this.focusedIndex.set(0);
    }
  }

  protected removeValue(val: string | number): void {
    this.value.set(this.value().filter((v) => v !== val));
    this.itemRemoved.emit(val);
  }

  protected isSelected(option: MultiSelectOption): boolean {
    return this.value().includes(option.value);
  }

  protected getOptionLabel(val: string | number): string {
    return this.options().find((opt) => opt.value === val)?.label ?? String(val);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen()) {
          const focused = this.availableOptions()[this.focusedIndex()];
          if (focused && !focused.disabled) {
            this.selectOption(focused);
          }
        } else {
          this.open();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          this.focusNext();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          this.focusPrevious();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private focusNext(): void {
    const options = this.availableOptions();
    let nextIndex = this.focusedIndex() + 1;
    while (nextIndex < options.length && options[nextIndex]?.disabled) {
      nextIndex++;
    }
    if (nextIndex < options.length) {
      this.focusedIndex.set(nextIndex);
    }
  }

  private focusPrevious(): void {
    const options = this.availableOptions();
    let prevIndex = this.focusedIndex() - 1;
    while (prevIndex >= 0 && options[prevIndex]?.disabled) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      this.focusedIndex.set(prevIndex);
    }
  }
}
