<!-- chunk:component:date-picker -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius-md input, radius-lg popup, mono for dates -->

# Date Picker

## Visual

- Trigger: Input with calendar icon (right side)
- Calendar popup: radius-lg, shadow-md, 12px padding

## Calendar Grid

- Day cells: 32x32px, radius-md
- Selected: bg-primary text-primary-foreground
- Today: border-border (1px)
- Range: bg-accent for intermediate days
- Outside month: text-muted-foreground opacity-50

## Navigation

Chevron buttons for month, dropdown for year.

## Accessibility

- `role="grid"` on calendar
- Arrow keys navigate days
- Home/End jump to start/end of week
- Page Up/Down change month

<!-- end:chunk -->
