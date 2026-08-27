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

@Component({
  selector: 'app-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-start gap-3">
      <div class="flex h-5 items-center">
        <input
          type="checkbox"
          [id]="checkboxId()"
          [checked]="checked()"
          [disabled]="disabled()"
          [indeterminate]="indeterminate()"
          [attr.aria-describedby]="description() ? checkboxId() + '-description' : null"
          [class]="checkboxClasses()"
          (change)="onCheckChange($event)"
          (blur)="onBlur()"
        />
      </div>

      @if (label() || description()) {
        <div class="flex flex-col">
          @if (label()) {
            <label [for]="checkboxId()" [class]="labelClasses()">
              {{ label() }}
            </label>
          }

          @if (description()) {
            <span [id]="checkboxId() + '-description'" class="text-xs text-muted-foreground">
              {{ description() }}
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly checkboxId = input<string>(`checkbox-${generateId()}`);
  readonly class = input<string>('');

  readonly checkedChange = output<boolean>();

  protected readonly checked = signal<boolean>(false);

  protected readonly checkboxClasses = computed(() =>
    cn(
      'h-4 w-4 rounded border border-slate-400 text-primary transition-all duration-150',
      'focus:ring-2 focus:ring-ring/50 focus:ring-offset-0',
      this.disabled()
        ? 'cursor-not-allowed opacity-50 bg-muted'
        : 'cursor-pointer hover:border-muted-foreground/50',
      this.class(),
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

  protected onCheckChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
    this.onChange(target.checked);
    this.checkedChange.emit(target.checked);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
