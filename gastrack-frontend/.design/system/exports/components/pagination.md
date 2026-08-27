<!-- chunk:component:pagination -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - 32px height, radius-md, steel-500 active -->

# Pagination

## Container

```
flex items-center gap-1
```

## Page Button

```
h-8 min-w-8 rounded-[4px] text-[13px] font-medium
flex items-center justify-center
text-foreground hover:bg-accent
transition-colors duration-[100ms]
```

Active page: `bg-primary text-primary-foreground`

Nav arrows: same size, ghost style, disabled when at bounds.

## Accessibility

- `nav` with `aria-label="Pagination"`
- Current: `aria-current="page"`
- Disabled: `aria-disabled="true"`

<!-- end:chunk -->
