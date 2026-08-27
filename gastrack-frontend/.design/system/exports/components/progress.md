<!-- chunk:component:progress -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, border-radius.md -->
<!-- migration: RESTYLE - radius-full track, 6px height, status colors -->

# Progress

## Visual

```
Track: h-1.5 w-full rounded-full bg-secondary overflow-hidden
Fill:  h-full rounded-full transition-all duration-[150ms]
```

## Variants

- Default: bg-primary
- Success: bg-success-500
- Warning: bg-warning-500
- Critical: bg-destructive

## Accessibility

- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label` describing what is progressing

<!-- end:chunk -->
