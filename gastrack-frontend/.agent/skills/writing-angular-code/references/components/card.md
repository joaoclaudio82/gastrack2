# Card Component Reference

## Location

`src/app/shared/components/ui/card/card.component.ts`

## Import

```typescript
import { CardComponent } from '@shared/components/ui';
```

---

## API

### Inputs

| Input       | Type                             | Default | Description             |
| ----------- | -------------------------------- | ------- | ----------------------- |
| `hoverable` | `boolean`                        | `false` | Add hover shadow effect |
| `bordered`  | `boolean`                        | `true`  | Show border             |
| `padding`   | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'`  | Internal padding        |

### Content Projection

Content is projected via `<ng-content>`.

---

## Usage Examples

### Basic

```html
<app-card>
  <h3 class="font-semibold">Card Title</h3>
  <p class="text-gray-600">Card content goes here.</p>
</app-card>
```

### Hoverable Card

```html
<app-card [hoverable]="true">
  <div class="cursor-pointer">Hover me for shadow effect</div>
</app-card>
```

### No Border

```html
<app-card [bordered]="false">Borderless card with shadow only</app-card>
```

### Different Padding

```html
<app-card padding="none">
  <img src="..." class="w-full" />
  <div class="p-4">Caption below image</div>
</app-card>

<app-card padding="sm">Compact card</app-card>

<app-card padding="lg">Spacious card</app-card>
```

### Card with Sections

```html
<app-card padding="none">
  <!-- Header -->
  <div class="px-4 py-3 border-b border-gray-200">
    <h3 class="font-semibold">Card Header</h3>
  </div>

  <!-- Body -->
  <div class="p-4">Card body content</div>

  <!-- Footer -->
  <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
    <app-button size="sm">Action</app-button>
  </div>
</app-card>
```

### Card Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  @for (item of items(); track item.id) {
  <app-card [hoverable]="true">
    <h4>{{ item.title }}</h4>
    <p>{{ item.description }}</p>
  </app-card>
  }
</div>
```

### Interactive Card

```html
<app-card [hoverable]="true" class="cursor-pointer" (click)="onCardClick()">
  Click anywhere on this card
</app-card>
```

---

## Styling Details

### Padding Sizes

| Size | Padding |
| ---- | ------- |
| none | p-0     |
| sm   | p-3     |
| md   | p-4     |
| lg   | p-6     |

### Base Styles

- Background: white
- Border radius: rounded-xl (0.75rem)
- Shadow: shadow-sm
- Border: border-gray-200 (when bordered)

### Hover Effect

When `hoverable="true"`:

- Transition: shadow-sm → shadow-md
- Duration: 200ms

---

## Notes

- Cards are block-level elements
- Use `padding="none"` for images that touch edges
- Combine with `cursor-pointer` for clickable cards
- Nest content freely with your own structure
