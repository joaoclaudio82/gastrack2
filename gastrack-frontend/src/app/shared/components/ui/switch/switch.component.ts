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

const switchVariants = cva(
  'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const knobVariants = cva(
  'pointer-events-none inline-flex items-center justify-center rounded-full bg-background shadow-lg ring-0 transition duration-150 ease-in-out',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const knobTranslate: Record<string, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-7',
};

type SwitchSize = NonNullable<VariantProps<typeof switchVariants>['size']>;
type LabelPosition = 'left' | 'right';

@Component({
  selector: 'app-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-center gap-3">
      @if (label() && labelPosition() === 'left') {
        <label [for]="switchId()" [class]="labelClasses()">
          {{ label() }}
        </label>
      }

      <button
        type="button"
        role="switch"
        [id]="switchId()"
        [attr.aria-checked]="checked()"
        [disabled]="disabled()"
        [class]="switchClasses()"
        (click)="toggle()"
        (blur)="onBlur()"
      >
        <span [class]="knobClasses()" aria-hidden="true">
          @if (checked()) {
            <svg
              class="h-3 w-3 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        </span>
      </button>

      @if (label() && labelPosition() === 'right') {
        <label [for]="switchId()" [class]="labelClasses()">
          {{ label() }}
        </label>
      }
    </div>
  `,
})
export class SwitchComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly labelPosition = input<LabelPosition>('right');
  readonly disabled = input<boolean>(false);
  readonly size = input<SwitchSize>('md');
  readonly switchId = input<string>(`switch-${generateId()}`);
  readonly class = input<string>('');

  readonly checkedChange = output<boolean>();

  protected readonly checked = signal<boolean>(false);

  protected readonly switchClasses = computed(() =>
    cn(
      switchVariants({ size: this.size() }),
      this.checked() ? 'bg-primary' : 'bg-input',
      this.disabled() && 'cursor-not-allowed opacity-50',
      this.class(),
    ),
  );

  protected readonly knobClasses = computed(() =>
    cn(
      knobVariants({ size: this.size() }),
      this.checked() ? knobTranslate[this.size()] : 'translate-x-0',
    ),
  );

  protected readonly labelClasses = computed(() =>
    cn(
      'text-sm font-medium',
      this.disabled()
        ? 'text-muted-foreground cursor-not-allowed'
        : 'text-foreground cursor-pointer',
    ),
  );

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {
    // Handled via input signal
  }

  protected toggle(): void {
    if (this.disabled()) return;

    const newValue = !this.checked();
    this.checked.set(newValue);
    this.onChange(newValue);
    this.checkedChange.emit(newValue);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
