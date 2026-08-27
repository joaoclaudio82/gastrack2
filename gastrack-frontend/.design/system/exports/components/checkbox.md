<!-- chunk:component:checkbox -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius-sm (2px), steel-500 checked, 16px box -->

# Checkbox

## Size

16x16px box.

## Visual

```
h-4 w-4 rounded-[2px] border border-input
transition-colors duration-[100ms]
```

## States

| State         | Visual                                       |
| ------------- | -------------------------------------------- |
| Unchecked     | border-input bg-transparent                  |
| Checked       | bg-primary border-primary + white check icon |
| Indeterminate | bg-primary border-primary + white dash icon  |
| Hover         | border-slate-300 dark:border-slate-400       |
| Focus         | ring-2 ring-ring ring-offset-2               |
| Disabled      | opacity-50 cursor-not-allowed                |

## Label

14px body text, 8px gap from checkbox.

## Accessibility

- Native `<input type="checkbox">`
- `aria-checked="mixed"` for indeterminate
- Label clickable via for/id pairing

<!-- end:chunk -->
