<!-- chunk:component:status-dot -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md -->
<!-- migration: NEW - 8px colored dot with optional pulse -->

# Status Dot

**Status: NEW component**

## Size

8px circle.

## Visual

```
h-2 w-2 rounded-full
```

## Variants

| Status   | Color                          |
| -------- | ------------------------------ |
| success  | bg-success-500                 |
| warning  | bg-warning-500                 |
| critical | bg-critical-500                |
| info     | bg-info-500                    |
| neutral  | bg-slate-300 dark:bg-slate-400 |

## Pulse Variant (live)

```
relative
[dot] h-2 w-2 rounded-full bg-success-500
[ping] absolute inset-0 rounded-full bg-success-500 animate-ping opacity-30
```

## Accessibility

- Must always have adjacent text label describing status
- `aria-hidden="true"` on the dot itself (text label carries meaning)

<!-- end:chunk -->
