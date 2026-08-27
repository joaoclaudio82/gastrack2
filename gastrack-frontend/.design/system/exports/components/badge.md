<!-- chunk:component:badge -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, border-radius.md -->
<!-- migration: RESTYLE - radius-full, 11px overline weight, status palette colors -->

# Badge

## Variants

default, success, warning, critical, info, outline

## Visual

```
inline-flex items-center rounded-full px-1.5 py-0.5
text-[11px] font-semibold leading-[1.6] tracking-[0.04em] uppercase
```

## Variant Styles

| Variant  | Background                          | Text                                    |
| -------- | ----------------------------------- | --------------------------------------- |
| default  | bg-secondary                        | text-foreground                         |
| success  | bg-success-50 dark:bg-success-900   | text-success-900 dark:text-success-50   |
| warning  | bg-warning-50 dark:bg-warning-900   | text-warning-900 dark:text-warning-50   |
| critical | bg-critical-50 dark:bg-critical-900 | text-critical-900 dark:text-critical-50 |
| info     | bg-info-50 dark:bg-info-900         | text-info-900 dark:text-info-50         |
| outline  | bg-transparent border border-border | text-foreground                         |

## Accessibility

- Purely visual; does not convey meaning alone
- Use `aria-label` or surrounding context for screen reader meaning

<!-- end:chunk -->
