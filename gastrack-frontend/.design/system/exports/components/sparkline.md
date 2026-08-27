<!-- chunk:component:sparkline -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md -->
<!-- migration: NEW - inline SVG trend line for tables and metric blocks -->

# Sparkline

**Status: NEW component**

## Type

Inline SVG polyline.

## Sizes

| Context        | Dimensions |
| -------------- | ---------- |
| Inline (table) | 48x16px    |
| Card           | 80x24px    |
| Large          | 120x32px   |

## Visual

```html
<svg viewBox="0 0 48 16" class="text-primary">
  <polyline
    points="..."
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
```

## Color

Uses status color when representing a metric with threshold (e.g., pressure trending into critical range uses critical-500).

## Angular Implementation

Standalone component with signal inputs for data points, size, and color. Uses computed() to calculate SVG polyline points from normalized data.

## Accessibility

- `role="img"`
- `aria-label="Trend: [description]"` (e.g., "Trend: decreasing over 7 days")

<!-- end:chunk -->
