# Dumb Component Pattern

## When to Use

- Reusable UI components in `shared/components/` or `features/*/components/`
- Components with only inputs and outputs
- No service injection
- No business logic
- Pure presentational components

---

## Template

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="p-4 bg-white rounded-lg shadow-sm border border-gray-200
             hover:shadow-md transition-shadow cursor-pointer"
      [ngClass]="{ 'ring-2 ring-blue-500': isSelected() }"
      (click)="onSelect()"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900 truncate">
          {{ item().name }}
        </h3>
        <span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="statusClasses()">
          {{ item().status }}
        </span>
      </div>

      <!-- Content -->
      <div class="space-y-2 text-sm text-gray-600">
        <p>{{ item().description }}</p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 mt-4">
        <button
          type="button"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
          (click)="onEdit($event)"
        >
          Edit
        </button>
        <button
          type="button"
          class="text-red-600 hover:text-red-800 text-sm font-medium"
          (click)="onDelete($event)"
        >
          Delete
        </button>
      </div>
    </div>
  `,
})
export class ItemCardComponent {
  // Required inputs
  readonly item = input.required<Item>();

  // Optional inputs with defaults
  readonly selected = input<boolean>(false);
  readonly showActions = input<boolean>(true);

  // Outputs
  readonly select = output<Item>();
  readonly edit = output<Item>();
  readonly delete = output<Item>();

  // Computed values (derived from inputs)
  readonly isSelected = computed(() => this.selected());

  readonly statusClasses = computed(() => {
    const status = this.item().status;
    return {
      'bg-green-100 text-green-800': status === 'active',
      'bg-gray-100 text-gray-800': status === 'inactive',
      'bg-red-100 text-red-800': status === 'error',
    };
  });

  // Event handlers
  onSelect(): void {
    this.select.emit(this.item());
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.item());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.item());
  }
}
```

---

## Key Principles

1. **No service injection** - Only inputs and outputs
2. **OnPush change detection** - Always
3. **Standalone** - Always
4. **Use signal inputs** - `input()` and `input.required()`
5. **Use signal outputs** - `output()`
6. **Computed for derived values** - Never duplicate state
7. **Stop propagation when needed** - For nested click handlers

---

## Input Patterns

```typescript
// Required input (must be provided)
readonly data = input.required<Data>();

// Optional input (may be undefined)
readonly label = input<string>();

// Optional with default
readonly size = input<'sm' | 'md' | 'lg'>('md');

// Transform input
readonly count = input(0, { transform: numberAttribute });

// Alias input
readonly item = input.required<Item>({ alias: 'data' });
```

---

## Output Patterns

```typescript
// Simple event
readonly clicked = output<void>();

// Event with data
readonly selected = output<Item>();

// Usage
this.clicked.emit();
this.selected.emit(this.item());
```

---

## File Location

```
// Shared (reusable across app)
src/app/shared/components/ui/<component-name>/
├── <component-name>.component.ts
└── index.ts

// Feature-specific
src/app/features/<domain>/components/<component-name>/
├── <component-name>.component.ts
└── index.ts
```

---

## Barrel Export

```typescript
// index.ts
export { ItemCardComponent } from './item-card.component';
```
