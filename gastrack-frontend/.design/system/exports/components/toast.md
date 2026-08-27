<!-- chunk:component:toast -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, elevation.md, border-radius.md -->
<!-- migration: REFACTOR - radius-lg, shadow-xl, auto-dismiss, progress bar -->

# Toast

**Migration action: REFACTOR**

## Visual

```
rounded-[6px] border border-border bg-card shadow-xl p-3 min-w-[320px] max-w-[420px]
flex items-start gap-3 z-[1080]
```

## Anatomy

1. Status icon: 16px, color-coded
2. Content: title (13px medium) + description (13px normal)
3. Dismiss button: ghost, right-aligned
4. Auto-dismiss progress bar: 2px height, bottom of toast

## Variants

info, success, warning, critical -- only icon and progress bar color change.

## Position

Bottom-right, stacked with 8px gap.

## Animation

- Enter: slide in from right 200ms
- Exit: fade out 150ms
- Progress bar: linear countdown (default 5s)

## Accessibility

- `role="alert"` with `aria-live="assertive"` for errors
- `role="status"` with `aria-live="polite"` for info/success

## Key REFACTOR Changes

- Add auto-dismiss progress bar (new feature)
- Add shadow-xl (floating element, was shadow-md)
- Standardize to radius-lg (6px)
- Add swipe-to-dismiss support

<!-- end:chunk -->
