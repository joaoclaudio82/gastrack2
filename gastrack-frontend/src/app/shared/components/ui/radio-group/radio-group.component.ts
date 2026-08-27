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
import { cn } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
}

type RadioOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'app-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <fieldset [disabled]="disabled()">
      @if (label()) {
        <legend class="text-sm font-medium text-foreground mb-3">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-destructive" aria-label="required">*</span>
          }
        </legend>
      }

      <div [class]="containerClasses()">
        @for (option of options(); track option.value) {
          <div class="flex items-start gap-3">
            <div class="flex h-5 items-center">
              <input
                type="radio"
                [id]="groupId() + '-' + option.value"
                [name]="groupId()"
                [value]="option.value"
                [checked]="value() === option.value"
                [disabled]="disabled() || option.disabled"
                [class]="radioClasses(option)"
                (change)="onSelect(option.value)"
                (blur)="onBlur()"
              />
            </div>

            <div class="flex flex-col">
              <label [for]="groupId() + '-' + option.value" [class]="labelClasses(option)">
                {{ option.label }}
              </label>

              @if (option.description) {
                <span class="text-xs text-muted-foreground">
                  {{ option.description }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      @if (error()) {
        <span class="mt-2 text-xs text-destructive flex items-center gap-1" role="alert">
          <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          {{ error() }}
        </span>
      }
    </fieldset>
  `,
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly options = input<RadioOption[]>([]);
  readonly orientation = input<RadioOrientation>('vertical');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly error = input<string>('');
  readonly groupId = input<string>(`radio-group-${generateId()}`);
  readonly class = input<string>('');

  readonly valueChange = output<string | number>();

  protected readonly value = signal<string | number | null>(null);

  protected readonly containerClasses = computed(() =>
    cn(
      this.orientation() === 'horizontal' ? 'flex flex-wrap gap-6' : 'flex flex-col gap-3',
      this.class(),
    ),
  );

  protected radioClasses(option: RadioOption): string {
    return cn(
      'h-4 w-4 border border-slate-400 text-primary transition-all duration-150',
      'focus:ring-2 focus:ring-ring/50 focus:ring-offset-0',
      this.disabled() || option.disabled
        ? 'cursor-not-allowed opacity-50 bg-muted'
        : 'cursor-pointer hover:border-muted-foreground/50',
    );
  }

  protected labelClasses(option: RadioOption): string {
    return cn(
      'text-sm font-medium',
      this.disabled() || option.disabled
        ? 'text-muted-foreground cursor-not-allowed'
        : 'text-foreground cursor-pointer',
    );
  }

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {
    // Handled via input signal
  }

  protected onSelect(value: string | number): void {
    if (this.disabled()) return;

    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
