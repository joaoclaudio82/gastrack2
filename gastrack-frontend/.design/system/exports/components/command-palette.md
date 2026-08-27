<!-- chunk:component:command-palette -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, elevation.md, border-radius.md -->
<!-- migration: NEW - Cmd+K overlay for navigation and actions -->

# Command Palette

**Status: NEW component**

## Anatomy

1. Backdrop: same as modal backdrop
2. Container: radius-lg, shadow-lg, bg-card, max-w-[540px], top-[20%]
3. Search input: no border, full-width, 16px text, bg-transparent
4. Results: grouped list, 36px items
5. Footer: keyboard hints

## Visual

```
Backdrop: fixed inset-0 bg-black/40 z-[1050]
Container: rounded-[6px] border border-border bg-card shadow-lg
           w-full max-w-[540px] overflow-hidden
Search: h-12 px-4 text-[16px] border-b border-border bg-transparent
        focus:outline-none
Item: h-9 px-3 flex items-center gap-3 text-[14px] text-foreground
      hover:bg-accent cursor-pointer
Group label: px-3 py-1.5 text-[11px] font-semibold uppercase
             tracking-[0.04em] text-muted-foreground
```

## Keyboard

- Cmd+K (or Ctrl+K) opens
- Arrow keys navigate items
- Enter selects
- Escape closes
- Type filters results

## Accessibility

- `role="dialog"` with `aria-label="Command palette"`
- `role="combobox"` on search input
- `role="listbox"` on results
- `aria-activedescendant` for highlighted item

<!-- end:chunk -->
