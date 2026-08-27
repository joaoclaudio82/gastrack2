import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-remember-me',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: RememberMeComponent,
      multi: true,
    },
  ],
  template: `
    <label class="flex items-center gap-1.5 cursor-pointer group">
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        class="h-3.5 w-3.5 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 cursor-pointer"
        (change)="onCheckChange($event)"
        (blur)="onBlur()"
      />
      <span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        Lembrar-me
      </span>
    </label>
  `,
})
export class RememberMeComponent implements ControlValueAccessor {
  checked = false;
  disabled = false;

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked = value ?? false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected onCheckChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChange(target.checked);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
