<!-- chunk:component:alert -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius-sm, IBM Plex Sans 13px, status colors from new palettes -->

# Alert

## Variants

info, success, warning, critical (destructive)

## Anatomy

1. Container: radius-sm, 1px border, 12px padding
2. Icon: 16px, status color
3. Title: 13px medium (optional)
4. Description: 14px body
5. Dismiss button: optional, ghost

## Tailwind Classes (info variant)

```
rounded-[2px] border border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900 p-3
flex gap-3
```

## Variant Border/Background

| Variant  | Light Border | Light BG    | Dark Border  | Dark BG      |
| -------- | ------------ | ----------- | ------------ | ------------ |
| info     | info-200     | info-50     | info-800     | info-900     |
| success  | success-200  | success-50  | success-800  | success-900  |
| warning  | warning-200  | warning-50  | warning-800  | warning-900  |
| critical | critical-200 | critical-50 | critical-800 | critical-900 |

## Accessibility

- `role="alert"` for critical alerts
- `role="status"` for informational alerts
- Dismiss button: `aria-label="Dismiss"`

<!-- end:chunk -->
