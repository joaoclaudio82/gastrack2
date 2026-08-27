# Review Fixes

> Phase: Review | Source: [CRITIQUE.md](../CRITIQUE.md) | Generated: 2026-03-12

---

## Critical Fixes

- **[Input Component]:** Height values do not match design tokens -- `md` uses `h-10` (40px) but token specifies 36px, `lg` uses `h-12` (48px) but token specifies 40px. This breaks form row alignment with adjacent buttons. -> Change input variant sizes to `md: 'h-9 px-4 text-sm'` and `lg: 'h-10 px-4 text-base'` in `src/app/shared/components/ui/input/input.component.ts`.

- **[Cylinders Page]:** `window.confirm()` for cylinder deactivation breaks visual language and provides no undo. -> Replace with confirmation modal using the existing `app-modal` component with destructive "Desativar" and secondary "Cancelar" buttons in `src/app/features/admin/pages/cylinders/cylinders.component.ts`.

- **[Dark Mode Status Colors]:** `--success-foreground` (L=0.185) and `--warning-foreground` (L=0.198) in dark mode are extremely dark and may fail WCAG 4.5:1 contrast against their background colors. -> Audit all dark-mode semantic foreground/background pairings in `src/styles.css` with a contrast checker and increase foreground lightness values as needed.

## Important Fixes

- **[Sidebar Component]:** Uses `shadow-2xl` which is not in the design system (max is `shadow-xl`), violating "Instrument, Don't Decorate" principle. -> Replace `shadow-2xl` with `shadow-sm` or remove entirely in `src/app/layouts/dashboard-layout/components/sidebar/sidebar.component.ts`.

- **[Sidebar Component]:** Uses hardcoded `duration-200` instead of design system transition token. -> Replace with a reference to `var(--transition-slow)` or appropriate token-aligned class.

- **[Modal Component]:** Uses `shadow-2xl` which exceeds the design system shadow scale. -> Change to `shadow-lg` in `src/app/shared/components/ui/modal/modal.component.ts`.

- **[Header Dropdown]:** Uses `shadow-2xl` which exceeds the design system shadow scale. -> Change to `shadow-md` in `src/app/layouts/dashboard-layout/components/header/header.component.ts`.

- **[Pressure Stats Component]:** Stat values use `text-4xl` (36px) exceeding `--text-display` max of 24px. -> Change to `text-2xl` or `text-[1.5rem]` in `src/app/features/analytics/components/pressure-stats/pressure-stats.component.ts`.

- **[Sidebar Navigation]:** Flat list of 12 items with no visual grouping reduces scanning efficiency. -> Add `border-t border-border mt-2 pt-2` dividers between logical groups (Operations, Management, Admin).

- **[Cylinder Table]:** Device IDs and serial numbers use sans-serif font where character distinction matters. -> Add `font-mono` class to device ID and serial number cells in `src/app/features/admin/pages/cylinders/cylinders.component.ts`.

- **[Data Table Component]:** Cell padding `px-6 py-4` produces row heights well above the 36px `--table-row-default` spec. -> Reduce to `px-4 py-2` or `px-6 py-2.5` in consuming templates.

- **[Settings Page]:** Toggle switches are raw HTML instead of a shared component. -> Extract into a reusable switch component or use the existing `SwitchComponent` in `src/app/features/admin/pages/settings/settings.component.ts`.

- **[Cylinders Page Filters]:** Search auto-applies with debounce but other filters require explicit "Aplicar filtros" click -- inconsistent mental model. -> Either auto-apply all filters with debounce or require explicit apply for all.

---

## Related

- [CRITIQUE.md](../CRITIQUE.md) -- full critique with heuristic scores and alternative directions
