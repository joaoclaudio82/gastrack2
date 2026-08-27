# CVA (Class Variance Authority) Pattern

## When to Use

- Components with multiple visual variants
- Components with multiple sizes
- Consistent styling with type safety
- Replacing complex ngClass logic

---

## CVA Utility

```typescript
// src/app/shared/utils/cva.ts

type ClassValue = string | undefined | null | false;
type ClassArray = ClassValue[];

export interface VariantConfig<TVariants extends Record<string, Record<string, string>>> {
  variants: TVariants;
  defaultVariants?: {
    [K in keyof TVariants]?: keyof TVariants[K];
  };
}

export function cva<TVariants extends Record<string, Record<string, string>>>(
  base: string,
  config: VariantConfig<TVariants>,
) {
  return (props?: { [K in keyof TVariants]?: keyof TVariants[K] }) => {
    const classes: ClassArray = [base];

    for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
      const selectedVariant =
        props?.[variantKey as keyof TVariants] ??
        config.defaultVariants?.[variantKey as keyof TVariants];

      if (selectedVariant && variantOptions[selectedVariant as string]) {
        classes.push(variantOptions[selectedVariant as string]);
      }
    }

    return classes.filter(Boolean).join(' ');
  };
}

// Helper to merge classes
export function cn(...classes: ClassArray): string {
  return classes.filter(Boolean).join(' ');
}
```

---

## Button Component Example

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { cva } from '@shared/utils/cva';

// Define variants outside component
export const buttonVariants = cva(
  // Base classes
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

// Type for variant props
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [class]="buttonClasses()"
      [disabled]="disabled() || loading()"
      (click)="onClick()"
    >
      @if (loading()) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
            fill="none"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  readonly click = output<void>();

  readonly buttonClasses = computed(() => {
    const base = buttonVariants({
      variant: this.variant(),
      size: this.size(),
    });

    const extras = this.fullWidth() ? 'w-full' : '';

    return `${base} ${extras}`.trim();
  });

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.click.emit();
    }
  }
}
```

---

## Usage in Templates

```html
<!-- Default (primary, md) -->
<app-button>Click Me</app-button>

<!-- Variants -->
<app-button variant="secondary">Secondary</app-button>
<app-button variant="danger">Delete</app-button>
<app-button variant="outline">Outline</app-button>
<app-button variant="ghost">Ghost</app-button>

<!-- Sizes -->
<app-button size="sm">Small</app-button>
<app-button size="lg">Large</app-button>

<!-- States -->
<app-button [disabled]="true">Disabled</app-button>
<app-button [loading]="true">Loading...</app-button>

<!-- Combined -->
<app-button variant="danger" size="lg" [fullWidth]="true">Delete All</app-button>
```

---

## Status Badge Example

```typescript
export const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      status: {
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        neutral: 'bg-gray-100 text-gray-800',
      },
    },
    defaultVariants: {
      status: 'neutral',
    },
  },
);
```

---

## Key Benefits

1. **Type safety** - TypeScript knows valid variant values
2. **Centralized** - All variants defined in one place
3. **Composable** - Easy to combine variants
4. **Readable** - Clear what each variant looks like
5. **Maintainable** - Change once, updates everywhere
