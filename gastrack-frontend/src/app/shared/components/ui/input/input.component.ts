import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

const inputVariants = cva(
  'flex w-full rounded-sm border bg-background text-foreground shadow-sm transition-all duration-150 placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-4 text-base',
      },
      state: {
        default: 'border-input hover:border-muted-foreground/50',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
        disabled: 'cursor-not-allowed bg-muted text-muted-foreground',
        readonly: 'cursor-default bg-muted/50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'datetime-local';
type InputSize = NonNullable<VariantProps<typeof inputVariants>['size']>;

@Component({
  selector: 'app-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [for]="inputId()">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-destructive" aria-label="required">*</span>
          }
        </label>
      }

      <div class="relative flex items-center">
        @if (prefixIcon()) {
          <span
            class="absolute left-3 flex items-center justify-center text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {{ prefixIcon() }}
          </span>
        }

        <input
          [id]="inputId()"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [value]="value()"
          [autocomplete]="autocomplete()"
          [attr.aria-invalid]="error() ? 'true' : 'false'"
          [attr.aria-describedby]="describedBy()"
          [class]="inputClasses()"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
        />

        @if (suffixIcon()) {
          <span
            class="absolute right-3 flex items-center justify-center text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {{ suffixIcon() }}
          </span>
        }
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
    :host input[type='date'],
    :host input[type='datetime-local'] {
      padding-right: 2.5rem;
    }
    :host input[type='date']::-webkit-calendar-picker-indicator,
    :host input[type='datetime-local']::-webkit-calendar-picker-indicator {
      position: absolute;
      right: 0.75rem;
      opacity: 0.6;
      cursor: pointer;
    }
    :host input[type='date']::-webkit-calendar-picker-indicator:hover,
    :host input[type='datetime-local']::-webkit-calendar-picker-indicator:hover {
      opacity: 1;
    }
  `,
})
export class InputComponent implements ControlValueAccessor {
  readonly type = input<InputType>('text');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly prefixIcon = input<string>('');
  readonly suffixIcon = input<string>('');
  readonly autocomplete = input<string>('off');
  readonly inputId = input<string>(`input-${generateId()}`);
  readonly size = input<InputSize>('md');
  readonly class = input<string>('');

  readonly valueChange = output<string>();
  // Re-emit raw DOM events so consumers can run side-effects (e.g. CEP autofill on blur).
  // Output names mirror native DOM events intentionally to keep template ergonomics aligned with <input>.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly input = output<Event>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly blur = output<FocusEvent>();

  protected readonly value = signal<string>('');

  protected readonly inputClasses = computed(() => {
    const state = this.error()
      ? 'error'
      : this.disabled()
        ? 'disabled'
        : this.readonly()
          ? 'readonly'
          : 'default';

    const iconPadding: string[] = [];
    if (this.prefixIcon()) {
      iconPadding.push(this.size() === 'lg' ? 'pl-10' : 'pl-9');
    }
    if (this.suffixIcon()) {
      iconPadding.push(this.size() === 'lg' ? 'pr-10' : 'pr-9');
    }

    return cn(inputVariants({ size: this.size(), state }), ...iconPadding, this.class());
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

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {
    // Handled via input signal
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.valueChange.emit(target.value);
    this.input.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blur.emit(event);
  }
}
