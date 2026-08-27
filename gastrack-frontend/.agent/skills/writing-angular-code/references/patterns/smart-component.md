# Smart Component Pattern

## When to Use

- Page-level components in `features/*/pages/`
- Components that need to inject services
- Components that manage state or orchestrate data flow
- Container components that pass data to dumb components

---

## Template

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

// Import dumb components
import { ItemCardComponent } from '../components/item-card/item-card.component';
import { FiltersComponent } from '../components/filters/filters.component';
import { LoadingSpinnerComponent } from '@shared/components/ui';

// Import service
import { ItemService } from '../services/item.service';

// Import models
import { Item, ItemFilters } from '@models/item.model';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [RouterLink, ItemCardComponent, FiltersComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Items</h1>
        <a routerLink="new" class="btn-primary">Add Item</a>
      </div>

      <!-- Filters -->
      <app-filters [filters]="filters()" (filtersChange)="onFiltersChange($event)" />

      <!-- Content -->
      @if (isLoading()) {
        <app-loading-spinner />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of items(); track item.id) {
            <app-item-card
              [item]="item"
              (select)="onItemSelect($event)"
              (delete)="onItemDelete($event)"
            />
          } @empty {
            <p class="col-span-full text-center text-gray-500">No items found</p>
          }
        </div>
      }
    </div>
  `,
})
export class ItemsListComponent {
  // Inject dependencies
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);

  // Expose service signals to template
  readonly items = this.itemService.filteredItems;
  readonly isLoading = this.itemService.isLoading;
  readonly filters = this.itemService.filters;

  // Event handlers
  onFiltersChange(filters: ItemFilters): void {
    this.itemService.updateFilters(filters);
  }

  onItemSelect(item: Item): void {
    void this.router.navigate(['/items', item.id]);
  }

  onItemDelete(item: Item): void {
    if (confirm(`Delete ${item.name}?`)) {
      this.itemService.delete(item.id).subscribe();
    }
  }
}
```

---

## Key Principles

1. **Use `inject()` for DI** - Never constructor injection
2. **OnPush change detection** - Always
3. **Standalone** - Always
4. **Expose service signals** - Direct binding, no intermediate variables
5. **Delegate to service** - Component orchestrates, service does work
6. **Pass data down** - Via inputs to dumb components
7. **Handle events up** - Via outputs from dumb components

---

## File Location

```
src/app/features/<domain>/pages/<component-name>/
├── <component-name>.component.ts
└── <component-name>.component.spec.ts
```

---

## Common Imports

```typescript
// Angular
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

// Shared UI
import { ButtonComponent, CardComponent, LoadingSpinnerComponent } from '@shared/components/ui';

// Feature components
import { ... } from '../components/...';

// Services
import { ... } from '../services/...';

// Models
import { ... } from '@models/...';
```
