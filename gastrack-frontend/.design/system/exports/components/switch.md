<!-- chunk:component:switch -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, spacing.md -->
<!-- migration: RESTYLE - 36x20px, steel-500 on, 150ms transition -->

# Switch

## Size

36px wide, 20px tall, 16px knob.

## Visual

```
w-9 h-5 rounded-full relative
transition-colors duration-[150ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
```

Knob: `h-4 w-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform duration-[150ms]`

## States

| State    | Track                          | Knob Position      |
| -------- | ------------------------------ | ------------------ |
| Off      | bg-slate-200 dark:bg-slate-600 | left-0.5           |
| On       | bg-primary                     | translate-x-[16px] |
| Focus    | ring-2 ring-ring ring-offset-2 | --                 |
| Disabled | opacity-50                     | --                 |

## Accessibility

- `role="switch"` with `aria-checked`
- Space key toggles

<!-- end:chunk -->
