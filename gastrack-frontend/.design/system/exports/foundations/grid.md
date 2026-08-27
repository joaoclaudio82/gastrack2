<!-- chunk:foundation:grid -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: spacing.md -->

# Grid System

## Configuration

| Property  | Value  |
| --------- | ------ |
| Columns   | 12     |
| Gutter    | 16px   |
| Max width | 1440px |

## Breakpoints

| Breakpoint | Width  | Columns | Gutter | Margin | Typical Layout         |
| ---------- | ------ | ------- | ------ | ------ | ---------------------- |
| sm         | 640px  | 4       | 16px   | 16px   | Single column, stacked |
| md         | 768px  | 8       | 16px   | 24px   | Two column             |
| lg         | 1024px | 12      | 16px   | 24px   | Sidebar + main         |
| xl         | 1280px | 12      | 16px   | 32px   | Full dashboard         |
| 2xl        | 1536px | 12      | 16px   | 32px   | Wide dashboard         |

## Layout Patterns

### Sidebar + Main (lg+)

- Sidebar: 240px fixed width (not grid-based)
- Main: remaining width, max 1440px, centered
- Main content uses 12-column grid internally

### Dashboard Grid

- KPI row: 4 columns on xl, 2 on md, 1 on sm
- Charts: span 6 or 8 columns on xl
- Tables: span full 12 columns

### Tailwind Implementation

```html
<!-- Sidebar + Main -->
<div class="flex">
  <aside class="w-60 shrink-0">...</aside>
  <main class="flex-1 max-w-[1440px] mx-auto px-6">
    <!-- KPI Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">...</div>
    <!-- Chart + Table -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 xl:col-span-8">...</div>
      <div class="col-span-12 xl:col-span-4">...</div>
    </div>
  </main>
</div>
```

<!-- tokens: breakpoints (sm, md, lg, xl, 2xl), grid columns, gutter, max-width -->
<!-- end:chunk -->
