# Form Control Pattern (ControlValueAccessor)

## When to Use

- Creating custom form inputs
- Wrapping native inputs with additional styling/behavior
- Components that need to work with Angular Forms (Reactive or Template-driven)

---

## Template

```typescript
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="space-y-1">
      <!-- Label -->
      @if (label()) {
        <label [for]="inputId" class="block text-sm font-medium text-gray-700">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <!-- Input -->
      <div class="relative">
        <input
          [id]="inputId"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [value]="value()"
          [class]="inputClasses()"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />

        <!-- Error icon -->
        @if (error()) {
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        }
      </div>

      <!-- Error message -->
      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <!-- Helper text -->
      @if (helperText() && !error()) {
        <p class="text-sm text-gray-500">{{ helperText() }}</p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  // Inputs
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'tel'>('text');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly error = input<string>('');
  readonly helperText = input<string>('');
  readonly required = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  // Internal state
  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);

  // Unique ID for label association
  protected readonly inputId = `input-${Math.random().toString(36).slice(2, 9)}`;

  // ControlValueAccessor callbacks
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  // Computed classes
  protected readonly inputClasses = () => {
    const base = 'block w-full rounded-lg border shadow-sm transition-all duration-200';
    const focus = 'focus:outline-none focus:ring-2 focus:ring-offset-0';

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const states = this.error()
      ? 'border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20';

    const disabled = this.isDisabled() ? 'bg-gray-50 cursor-not-allowed' : 'bg-white';

    return `${base} ${focus} ${sizes[this.size()]} ${states} ${disabled}`;
  };

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // Event handler
  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }
}
```

---

## Usage

### With Reactive Forms

```typescript
@Component({
  template: `
    <form [formGroup]="form">
      <app-input
        formControlName="email"
        type="email"
        label="Email"
        placeholder="your@email.com"
        [error]="getError('email')"
        [required]="true"
      />

      <app-input
        formControlName="password"
        type="password"
        label="Password"
        [error]="getError('password')"
        [required]="true"
      />
    </form>
  `,
})
export class FormComponent {
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Invalid email';
    if (control.errors['minlength'])
      return `Min ${control.errors['minlength'].requiredLength} chars`;
    return '';
  }
}
```

### With Template-driven Forms

```html
<app-input [(ngModel)]="email" type="email" label="Email" placeholder="your@email.com" />
```

---

## Key Points

1. **Provide NG_VALUE_ACCESSOR** - Register as form control
2. **Use forwardRef** - Component not yet defined when provider declared
3. **Implement all 4 methods**:
   - `writeValue` - Set value from form
   - `registerOnChange` - Callback for value changes
   - `registerOnTouched` - Callback for blur
   - `setDisabledState` - Handle disabled state
4. **Call callbacks** - `onChange` on input, `onTouched` on blur
5. **Use signals for internal state** - Value and disabled state
