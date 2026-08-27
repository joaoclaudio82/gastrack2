<!-- chunk:component:radio-group -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, spacing.md -->
<!-- migration: RESTYLE - 16px circle, steel-500 selected, 14px label -->

# Radio Group

## Size

16x16px circle.

## Visual

```
h-4 w-4 rounded-full border border-input
transition-colors duration-[100ms]
```

## States

| State    | Visual                                              |
| -------- | --------------------------------------------------- |
| Default  | border-input bg-transparent                         |
| Selected | border-primary + inner 6px filled circle bg-primary |
| Hover    | border-slate-300 dark:border-slate-400              |
| Focus    | ring-2 ring-ring ring-offset-2                      |
| Disabled | opacity-50 cursor-not-allowed                       |

Label: 14px, 8px gap. Group label: 13px medium.

## Accessibility

- `role="radiogroup"` on container
- Arrow keys navigate between options
- Only selected item in tab order

<!-- end:chunk -->
