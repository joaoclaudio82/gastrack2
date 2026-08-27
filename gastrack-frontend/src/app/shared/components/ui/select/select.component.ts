import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

export interface SelectOption {
  label: string;
  value: string | number | null;
  disabled?: boolean;
}

const selectTriggerVariants = cva(
  'relative flex w-full min-w-0 items-center justify-between rounded-xl border bg-background text-foreground shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm gap-2',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-4 text-base gap-3',
      },
      state: {
        default: 'border-input hover:border-muted-foreground/50',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
        disabled: 'cursor-not-allowed bg-muted text-muted-foreground',
        open: 'border-primary ring-2 ring-ring/20',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

type SelectSize = NonNullable<VariantProps<typeof selectTriggerVariants>['size']>;

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
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
          [attr.title]="selectedOption()?.label || placeholder() || null"
          (click)="toggle()"
          (keydown)="onKeydown($event)"
        >
          <span
            class="flex-1 truncate text-left min-w-0"
            [class.text-muted-foreground]="!selectedOption()"
          >
            {{ selectedOption()?.label || placeholder() || 'Selecione...' }}
          </span>
          <div class="flex items-center gap-1 flex-shrink-0">
            @if (clearable() && selectedOption() && !disabled()) {
              <button
                type="button"
                class="p-0.5 rounded hover:bg-accent transition-colors"
                (click)="clearValue($event)"
                aria-label="Limpar seleção"
              >
                <svg
                  class="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            }
            <svg
              class="h-4 w-4 text-muted-foreground transition-transform duration-200"
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
            class="w-full max-h-60 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          >
            @for (option of options(); track option.value; let i = $index) {
              <button
                type="button"
                role="option"
                [attr.aria-selected]="isSelected(option)"
                [disabled]="option.disabled"
                class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                [class.bg-accent]="focusedIndex() === i"
                [class.text-accent-foreground]="focusedIndex() === i"
                [class.hover:bg-accent]="!option.disabled"
                [class.hover:text-accent-foreground]="!option.disabled"
                [class.opacity-50]="option.disabled"
                [class.cursor-not-allowed]="option.disabled"
                (click)="selectOption(option)"
                (mouseenter)="focusedIndex.set(i)"
              >
                <span class="flex-1 text-left">{{ option.label }}</span>
                @if (isSelected(option)) {
                  <svg
                    class="h-4 w-4 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              </button>
            }

            @if (options().length === 0) {
              <div class="px-3 py-2 text-sm text-muted-foreground text-center">
                Nenhuma opção disponível
              </div>
            }
          </div>
        </ng-template>
      </div>

      @if (!compact() || error() || hint()) {
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
      }
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
export class SelectComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabledInput = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly compact = input<boolean>(false);
  readonly options = input<SelectOption[]>([]);
  readonly selectId = input<string>(`select-${generateId()}`);
  readonly size = input<SelectSize>('md');
  readonly class = input<string>('');

  protected readonly listboxId = computed(() => `${this.selectId()}-listbox`);

  readonly valueChange = output<string | number | null>();

  protected readonly value = signal<string | number | null>(null);
  protected readonly isOpen = signal(false);
  protected readonly focusedIndex = signal(-1);
  protected readonly triggerWidth = signal(0);
  private readonly disabledFromForm = signal(false);

  private readonly triggerElement = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');

  protected readonly disabled = computed(() => this.disabledInput() || this.disabledFromForm());

  protected readonly selectedOption = computed(() => {
    const currentValue = this.value();
    return this.options().find((opt) => opt.value === currentValue) ?? null;
  });

  protected readonly triggerClasses = computed(() => {
    let state: 'default' | 'error' | 'disabled' | 'open' = 'default';
    if (this.error()) state = 'error';
    else if (this.disabled()) state = 'disabled';
    else if (this.isOpen()) state = 'open';

    return cn(selectTriggerVariants({ size: this.size(), state }));
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) {
      ids.push(`${this.selectId()}-error`);
    } else if (this.hint()) {
      ids.push(`${this.selectId()}-hint`);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  private onChangeCallback: (value: string | number | null) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  writeValue(value: string | number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledFromForm.set(isDisabled);
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
    const selectedIndex = this.options().findIndex((opt) => opt.value === this.value());
    this.focusedIndex.set(selectedIndex >= 0 ? selectedIndex : 0);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.onTouchedCallback();
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled) return;

    this.value.set(option.value);
    this.onChangeCallback(option.value);
    this.valueChange.emit(option.value);
    this.close();
  }

  protected clearValue(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChangeCallback(null);
    this.valueChange.emit(null);
  }

  protected isSelected(option: SelectOption): boolean {
    return this.value() === option.value;
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen()) {
          const focused = this.options()[this.focusedIndex()];
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
    const options = this.options();
    let nextIndex = this.focusedIndex() + 1;

    while (nextIndex < options.length && options[nextIndex]?.disabled) {
      nextIndex++;
    }

    if (nextIndex < options.length) {
      this.focusedIndex.set(nextIndex);
    }
  }

  private focusPrevious(): void {
    const options = this.options();
    let prevIndex = this.focusedIndex() - 1;

    while (prevIndex >= 0 && options[prevIndex]?.disabled) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      this.focusedIndex.set(prevIndex);
    }
  }
}
