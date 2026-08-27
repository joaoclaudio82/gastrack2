<!-- chunk:component:multi-select -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: REFACTOR - radius-md, compact tags, keyboard nav, clear-all -->

# Multi Select

**Migration action: REFACTOR**

## Visual

Container: same border/radius as Input.

## Tag

```
inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5
text-[11px] font-medium text-foreground
```

Tag remove button: 12px X icon, `hover:bg-slate-200`.

## Clear All

Text button: `text-[12px] text-muted-foreground hover:text-foreground`.

## Keyboard

- Backspace removes last tag when input is empty
- All combobox keyboard patterns apply

## Key REFACTOR Changes

- Add clear-all button
- Compact tag sizing (11px, tighter padding)
- Fix backspace-to-remove behavior
- Add keyboard navigation for tag removal

<!-- end:chunk -->
