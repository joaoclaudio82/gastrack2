<!-- chunk:component:calendar -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius-sm container, 4px cell radius, compact 32px cells -->

# Calendar

Same grid as Date Picker but rendered inline (not popup).

## Container

```
rounded-[2px] border border-border bg-card p-3
```

## Day Cells

- Size: 32x32px
- Radius: rounded-[4px]
- Selected: bg-primary text-primary-foreground
- Today: border border-border
- Range: bg-accent
- Outside month: text-muted-foreground opacity-50

## Navigation

Chevron buttons for month, dropdown for year.

## Accessibility

- `role="grid"` on calendar
- Arrow keys navigate days
- Home/End: start/end of week
- Page Up/Down: change month

<!-- end:chunk -->
