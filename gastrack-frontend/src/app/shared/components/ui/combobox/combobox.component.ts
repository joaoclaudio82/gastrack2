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
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

export interface ComboboxOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

const comboboxTriggerVariants = cva(
  'relative flex w-full min-w-0 items-center justify-between rounded-sm border bg-background text-foreground shadow-sm transition-all duration-150 focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-primary disabled:cursor-not-allowed disabled:opacity-50',
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
          'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
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

type ComboboxSize = NonNullable<VariantProps<typeof comboboxTriggerVariants>['size']>;

@Component({
  selector: 'app-combobox',
  standalone: true,
  imports: [FormsModule, CdkOverlayOrigin, CdkConnectedOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboboxComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative flex flex-col gap-1.5 min-w-0" [class]="class()">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [for]="inputId()">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-destructive" aria-label="required">*</span>
          }
        </label>
      }

      <div class="relative min-w-0">
        <!-- Input with dropdown trigger -->
        <div #triggerDiv cdkOverlayOrigin #trigger="cdkOverlayOrigin" [class]="triggerClasses()">
          <input
            type="text"
            [id]="inputId()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [value]="searchQuery()"
            [attr.aria-expanded]="isOpen()"
            [attr.aria-haspopup]="'listbox'"
            [attr.aria-controls]="listboxId()"
            [attr.aria-invalid]="error() ? 'true' : 'false'"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-activedescendant]="activeDescendant()"
            class="flex-1 min-w-0 bg-transparent outline-none border-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            autocomplete="off"
            role="combobox"
            (input)="onSearchInput($event)"
            (focus)="onFocus()"
            (keydown)="onKeydown($event)"
            #inputEl
          />
          <div class="flex items-center gap-1 shrink-0">
            @if (value() && clearable() && !disabled()) {
              <button
                type="button"
                class="p-1 min-h-6 min-w-6 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                (click)="clearValue($event)"
                aria-label="Limpar seleção"
                tabindex="-1"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            }
            @if (loading()) {
              <svg
                class="h-4 w-4 animate-spin text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            } @else {
              <svg
                class="h-4 w-4 text-muted-foreground transition-transform"
                [class.rotate-180]="isOpen()"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            }
          </div>
        </div>

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
            [id]="listboxId()"
            class="w-full max-h-60 overflow-auto rounded-sm border border-border bg-popover shadow-lg animate-in"
            role="listbox"
            [attr.aria-label]="label() || 'Opções'"
          >
            @if (filteredOptions().length === 0) {
              <div class="px-4 py-3 text-sm text-muted-foreground text-center">
                {{ emptyMessage() }}
              </div>
            } @else {
              @for (option of filteredOptions(); track option.value; let i = $index) {
                <button
                  type="button"
                  [id]="inputId() + '-option-' + i"
                  role="option"
                  [attr.aria-selected]="isSelected(option)"
                  [disabled]="option.disabled"
                  class="relative flex w-full cursor-pointer select-none items-center px-4 py-2 text-sm outline-none transition-colors text-left"
                  [class.bg-accent]="highlightedIndex() === i"
                  [class.text-accent-foreground]="highlightedIndex() === i"
                  [class.bg-primary]="isSelected(option)"
                  [class.text-primary-foreground]="isSelected(option)"
                  [class.opacity-50]="option.disabled"
                  [class.cursor-not-allowed]="option.disabled"
                  (click)="selectOption(option)"
                  (mouseenter)="highlightedIndex.set(i)"
                >
                  <span class="flex-1">{{ option.label }}</span>
                  @if (isSelected(option)) {
                    <svg
                      class="h-4 w-4 ml-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  }
                </button>
              }
            }
          </div>
        </ng-template>
      </div>

      <div class="min-h-[18px]">
        @if (error()) {
          <span
            [id]="inputId() + '-error'"
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
          <span [id]="inputId() + '-hint'" class="text-xs text-muted-foreground">
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
export class ComboboxComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Buscar...');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabledInput = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly clearable = input<boolean>(true);
  readonly inputId = input<string>(`combobox-${generateId()}`);
  readonly size = input<ComboboxSize>('md');
  readonly class = input<string>('');
  readonly options = input<ComboboxOption[]>([]);
  readonly loading = input<boolean>(false);
  readonly emptyMessage = input<string>('Nenhum resultado encontrado');
  readonly filterLocally = input<boolean>(true);

  readonly valueChange = output<string | number | null>();
  readonly searchChange = output<string>();
  readonly cleared = output();

  protected readonly value = signal<string | number | null>(null);
  protected readonly searchQuery = signal<string>('');
  protected readonly isOpen = signal(false);
  protected readonly highlightedIndex = signal<number>(-1);
  protected readonly triggerWidth = signal(0);
  private readonly disabledFromForm = signal(false);

  private readonly triggerDiv = viewChild<ElementRef<HTMLDivElement>>('triggerDiv');
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly disabled = computed(() => this.disabledInput() || this.disabledFromForm());

  protected readonly filteredOptions = computed(() => {
    const opts = this.options();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query || !this.filterLocally()) {
      return opts;
    }

    // Quando o texto do input é apenas o label do item já selecionado sendo exibido
    // (e não uma busca digitada), mostra todas as opções — senão o dropdown filtra
    // até sobrar só o próprio selecionado e o usuário não consegue trocar sem limpar.
    const selectedLabel = this.selectedOption()?.label.toLowerCase().trim();
    if (selectedLabel && query === selectedLabel) {
      return opts;
    }

    return opts.filter((opt) => opt.label.toLowerCase().includes(query));
  });

  protected readonly selectedOption = computed(() => {
    const val = this.value();
    if (val === null) return null;
    return this.options().find((opt) => opt.value === val) ?? null;
  });

  protected readonly triggerClasses = computed(() => {
    let state: 'default' | 'error' | 'disabled' | 'open' = 'default';
    if (this.error()) state = 'error';
    else if (this.disabled()) state = 'disabled';
    else if (this.isOpen()) state = 'open';

    return cn(comboboxTriggerVariants({ size: this.size(), state }));
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) {
      ids.push(`${this.inputId()}-error`);
    } else if (this.hint()) {
      ids.push(`${this.inputId()}-hint`);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  protected readonly activeDescendant = computed(() => {
    const index = this.highlightedIndex();
    if (index < 0) return null;
    return `${this.inputId()}-option-${index}`;
  });

  protected readonly listboxId = computed(() => `${this.inputId()}-listbox`);

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  writeValue(value: string | number | null): void {
    this.value.set(value);
    // Update search query to show selected label
    const option = this.options().find((opt) => opt.value === value);
    this.searchQuery.set(option?.label ?? '');
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledFromForm.set(isDisabled);
  }

  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.searchChange.emit(input.value);
    this.highlightedIndex.set(0);

    if (!this.isOpen()) {
      this.open();
    }
  }

  protected onFocus(): void {
    if (!this.disabled()) {
      this.open();
    }
  }

  protected open(): void {
    if (this.disabled()) return;
    const trigger = this.triggerDiv()?.nativeElement;
    if (trigger) {
      this.triggerWidth.set(trigger.offsetWidth);
    }
    this.isOpen.set(true);
    this.highlightedIndex.set(0);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
    this.onTouched();

    // Restore selected label if no selection was made
    const selected = this.selectedOption();
    this.searchQuery.set(selected?.label ?? '');
  }

  protected selectOption(option: ComboboxOption): void {
    if (option.disabled) return;

    this.value.set(option.value);
    this.searchQuery.set(option.label);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.close();
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this.value.set(null);
    this.searchQuery.set('');
    this.onChange(null);
    this.valueChange.emit(null);
    this.cleared.emit();
    this.onTouched();

    // Focus input after clearing
    this.inputEl()?.nativeElement.focus();
  }

  protected isSelected(option: ComboboxOption): boolean {
    return this.value() === option.value;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          const nextIndex = Math.min(this.highlightedIndex() + 1, options.length - 1);
          this.highlightedIndex.set(nextIndex);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          const prevIndex = Math.max(this.highlightedIndex() - 1, 0);
          this.highlightedIndex.set(prevIndex);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen() && this.highlightedIndex() >= 0) {
          const option = options[this.highlightedIndex()];
          if (option && !option.disabled) {
            this.selectOption(option);
          }
        } else {
          this.open();
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
}
