<!-- chunk:component:pressure-gauge -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md -->
<!-- migration: NEW - domain icon showing pressure level -->

# Pressure Gauge

**Status: NEW component**

## Type

Small SVG icon component showing a gauge level.

## Sizes

- Small: 24x24px
- Default: 32x32px

## Visual

SVG semicircle gauge with fill level and color based on pressure thresholds.

## Color Mapping

Colors map to tank status:

- Full: success palette
- Normal: info palette
- Low: warning palette
- Critical: critical palette
- Empty: slate palette

## Accessibility

- `role="img"`
- `aria-label="Pressure: [value] bar ([status])"` (e.g., "Pressure: 145 bar (normal)")

<!-- end:chunk -->
