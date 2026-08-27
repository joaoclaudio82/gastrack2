# Modal Component Reference

## Location

`src/app/shared/components/ui/modal/modal.component.ts`

## Import

```typescript
import { ModalComponent } from '@shared/components/ui';
```

---

## API

### Inputs

| Input             | Type                           | Default | Description                  |
| ----------------- | ------------------------------ | ------- | ---------------------------- |
| `isOpen`          | `boolean`                      | `false` | Control visibility           |
| `title`           | `string`                       | `''`    | Modal header title           |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`  | Modal width                  |
| `closeOnBackdrop` | `boolean`                      | `true`  | Close when clicking backdrop |
| `closeOnEscape`   | `boolean`                      | `true`  | Close on Escape key          |
| `showClose`       | `boolean`                      | `true`  | Show X button                |

### Outputs

| Output   | Type   | Description               |
| -------- | ------ | ------------------------- |
| `closed` | `void` | Emitted when modal closes |

### Content Projection

- Default slot: Modal body content
- Named slot `footer`: Modal footer actions

---

## Usage Examples

### Basic Modal

```html
<app-button (click)="isModalOpen = true">Open Modal</app-button>

<app-modal [isOpen]="isModalOpen" title="Modal Title" (closed)="isModalOpen = false">
  <p>Modal body content goes here.</p>

  <ng-container footer>
    <app-button variant="outline" (click)="isModalOpen = false">Cancel</app-button>
    <app-button (click)="onConfirm()">Confirm</app-button>
  </ng-container>
</app-modal>
```

### Confirmation Dialog

```html
<app-modal
  [isOpen]="showDeleteConfirm"
  title="Confirm Delete"
  size="sm"
  (closed)="showDeleteConfirm = false"
>
  <p class="text-gray-600">
    Are you sure you want to delete this item? This action cannot be undone.
  </p>

  <ng-container footer>
    <app-button variant="outline" (click)="showDeleteConfirm = false">Cancel</app-button>
    <app-button variant="danger" (click)="confirmDelete()">Delete</app-button>
  </ng-container>
</app-modal>
```

### Form Modal

```html
<app-modal
  [isOpen]="showForm"
  title="Create Item"
  size="lg"
  [closeOnBackdrop]="false"
  (closed)="onFormClose()"
>
  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="space-y-4">
      <app-input formControlName="name" label="Name" [required]="true" [error]="getError('name')" />

      <app-input
        formControlName="email"
        type="email"
        label="Email"
        [required]="true"
        [error]="getError('email')"
      />
    </div>

    <ng-container footer>
      <app-button variant="outline" type="button" (click)="showForm = false">Cancel</app-button>
      <app-button type="submit" [loading]="isSubmitting" [disabled]="form.invalid">
        Create
      </app-button>
    </ng-container>
  </form>
</app-modal>
```

### Info Modal (No Footer)

```html
<app-modal [isOpen]="showInfo" title="Information" (closed)="showInfo = false">
  <div class="prose">
    <p>Some informational content...</p>
    <ul>
      <li>Point 1</li>
      <li>Point 2</li>
    </ul>
  </div>
</app-modal>
```

### Different Sizes

```html
<app-modal size="sm" title="Small">...</app-modal>
<app-modal size="md" title="Medium">...</app-modal>
<app-modal size="lg" title="Large">...</app-modal>
<app-modal size="xl" title="Extra Large">...</app-modal>
```

### Prevent Accidental Close

```html
<app-modal
  [isOpen]="hasUnsavedChanges"
  title="Edit Item"
  [closeOnBackdrop]="false"
  [closeOnEscape]="false"
  (closed)="onModalClose()"
>
  <!-- Form with unsaved changes -->
</app-modal>
```

---

## Size Dimensions

| Size | Max Width        |
| ---- | ---------------- |
| sm   | max-w-sm (24rem) |
| md   | max-w-md (28rem) |
| lg   | max-w-lg (32rem) |
| xl   | max-w-xl (36rem) |

---

## Notes

- Modal traps focus for accessibility
- ESC key closes by default (configurable)
- Backdrop click closes by default (configurable)
- Body scroll is locked when open
- Footer buttons should be right-aligned (flex justify-end gap-2)
