# Button Component Reference

## Location

`src/app/shared/components/ui/button/button.component.ts`

## Import

```typescript
import { ButtonComponent } from '@shared/components/ui';
```

---

## API

### Inputs

| Input       | Type                                                           | Default     | Description                |
| ----------- | -------------------------------------------------------------- | ----------- | -------------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'danger' \| 'outline' \| 'ghost'` | `'primary'` | Visual style               |
| `size`      | `'sm' \| 'md' \| 'lg'`                                         | `'md'`      | Button size                |
| `type`      | `'button' \| 'submit' \| 'reset'`                              | `'button'`  | HTML type                  |
| `disabled`  | `boolean`                                                      | `false`     | Disabled state             |
| `loading`   | `boolean`                                                      | `false`     | Loading state with spinner |
| `fullWidth` | `boolean`                                                      | `false`     | Full container width       |

### Outputs

| Output  | Type   | Description                                  |
| ------- | ------ | -------------------------------------------- |
| `click` | `void` | Emitted on click (not when disabled/loading) |

---

## Usage Examples

### Basic

```html
<app-button>Click Me</app-button>
```

### Variants

```html
<app-button variant="primary">Primary</app-button>
<app-button variant="secondary">Secondary</app-button>
<app-button variant="danger">Delete</app-button>
<app-button variant="outline">Outline</app-button>
<app-button variant="ghost">Ghost</app-button>
```

### Sizes

```html
<app-button size="sm">Small</app-button>
<app-button size="md">Medium</app-button>
<app-button size="lg">Large</app-button>
```

### Form Submit

```html
<form (ngSubmit)="onSubmit()">
  <app-button type="submit" [loading]="isSubmitting">Submit</app-button>
</form>
```

### With Icon

```html
<app-button variant="primary">
  <svg class="w-4 h-4 mr-2">...</svg>
  Add Item
</app-button>
```

### Loading State

```html
<app-button [loading]="isSaving">{{ isSaving ? 'Saving...' : 'Save' }}</app-button>
```

### Full Width

```html
<app-button [fullWidth]="true" size="lg">Full Width Button</app-button>
```

### Disabled

```html
<app-button [disabled]="!form.valid">Submit</app-button>
```

---

## Styling Details

### Variant Colors

| Variant   | Background  | Text     | Hover    |
| --------- | ----------- | -------- | -------- |
| primary   | blue-600    | white    | blue-700 |
| secondary | gray-100    | gray-900 | gray-200 |
| danger    | red-600     | white    | red-700  |
| outline   | transparent | gray-700 | gray-50  |
| ghost     | transparent | gray-700 | gray-100 |

### Size Dimensions

| Size | Height | Padding X | Font      |
| ---- | ------ | --------- | --------- |
| sm   | h-8    | px-3      | text-sm   |
| md   | h-10   | px-4      | text-base |
| lg   | h-12   | px-6      | text-lg   |

---

## Notes

- Always use `type="submit"` inside forms
- `loading` automatically disables the button
- Content is projected via `<ng-content>`
- Focus ring appears on keyboard focus
