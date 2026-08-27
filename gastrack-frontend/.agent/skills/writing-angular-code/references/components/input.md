# Input Component Reference

## Location

`src/app/shared/components/ui/input/input.component.ts`

## Import

```typescript
import { InputComponent } from '@shared/components/ui';
```

---

## API

### Inputs

| Input         | Type                                                   | Default  | Description             |
| ------------- | ------------------------------------------------------ | -------- | ----------------------- |
| `type`        | `'text' \| 'email' \| 'password' \| 'number' \| 'tel'` | `'text'` | Input type              |
| `label`       | `string`                                               | `''`     | Label text              |
| `placeholder` | `string`                                               | `''`     | Placeholder text        |
| `error`       | `string`                                               | `''`     | Error message           |
| `helperText`  | `string`                                               | `''`     | Helper text below input |
| `required`    | `boolean`                                              | `false`  | Show required indicator |
| `size`        | `'sm' \| 'md' \| 'lg'`                                 | `'md'`   | Input size              |

### Form Integration

Implements `ControlValueAccessor` - works with both Reactive and Template-driven forms.

---

## Usage Examples

### Basic

```html
<app-input type="text" label="Name" placeholder="Enter your name" />
```

### With Reactive Forms

```html
<form [formGroup]="form">
  <app-input
    formControlName="email"
    type="email"
    label="Email"
    placeholder="your@email.com"
    [error]="getError('email')"
    [required]="true"
  />
</form>
```

```typescript
form = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
});

getError(field: string): string {
  const control = this.form.get(field);
  if (!control?.touched || !control.errors) return '';
  if (control.errors['required']) return 'Email is required';
  if (control.errors['email']) return 'Invalid email format';
  return '';
}
```

### With Template-driven Forms

```html
<app-input [(ngModel)]="name" type="text" label="Name" required />
```

### Password Input

```html
<app-input
  formControlName="password"
  type="password"
  label="Password"
  placeholder="Enter password"
  [error]="getError('password')"
  [required]="true"
/>
```

### With Helper Text

```html
<app-input
  type="tel"
  label="Phone"
  placeholder="(00) 00000-0000"
  helperText="Brazilian phone format"
/>
```

### Different Sizes

```html
<app-input size="sm" label="Small" />
<app-input size="md" label="Medium" />
<app-input size="lg" label="Large" />
```

### Error State

```html
<app-input type="email" label="Email" error="Please enter a valid email address" />
```

---

## Styling Details

### Size Dimensions

| Size | Padding     | Font      |
| ---- | ----------- | --------- |
| sm   | px-3 py-1.5 | text-sm   |
| md   | px-4 py-2.5 | text-base |
| lg   | px-5 py-3   | text-lg   |

### States

| State    | Border   | Ring           |
| -------- | -------- | -------------- |
| Default  | gray-300 | -              |
| Focus    | blue-500 | blue-500/20    |
| Error    | red-300  | red-500/20     |
| Disabled | gray-300 | - (bg-gray-50) |

---

## Notes

- Label automatically gets `for` attribute linked to input
- Required indicator (\*) appears when `required="true"`
- Error message replaces helper text when present
- Disabled state applied via Angular Forms
