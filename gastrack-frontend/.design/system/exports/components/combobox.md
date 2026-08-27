<!-- chunk:component:combobox -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: REFACTOR - radius-md input, radius-lg dropdown, compact items, keyboard nav -->

# Combobox

**Migration action: REFACTOR**

## Visual

- Input: same as Input component (radius-md, heights match)
- Dropdown: same as Select dropdown (radius-lg, shadow-sm)
- Items: same as Select options

## Key Difference

Filterable. As user types, options filter in real time.

## Empty State

"No results found" in muted-foreground, 13px.

## Keyboard

- Arrow keys navigate filtered options
- Enter selects highlighted option
- Escape closes dropdown

## Accessibility

- `role="combobox"` on input
- `aria-expanded`, `aria-controls`, `aria-activedescendant`
- Filtered option count announced via `aria-live` region

## Key REFACTOR Changes

- Standardize item height to 36px
- Review and fix keyboard navigation edge cases
- Add `aria-live` region for filtered count

<!-- end:chunk -->
