<!-- chunk:foundation:elevation -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, border-radius.md -->

# Elevation

## Philosophy

Surfaces are differentiated by lightness, not shadows. Shadows are reserved exclusively for floating elements that need to appear detached from the page surface.

## Shadow Scale

| Token       | Value                                | Usage                           |
| ----------- | ------------------------------------ | ------------------------------- |
| shadow-none | none                                 | Cards, containers (default)     |
| shadow-sm   | 0 1px 2px 0 oklch(0 0 0 / 0.04)      | Dropdowns, select menus         |
| shadow-md   | 0 2px 6px -1px oklch(0 0 0 / 0.08)   | Popovers, tooltips              |
| shadow-lg   | 0 8px 16px -4px oklch(0 0 0 / 0.12)  | Modals, command palette         |
| shadow-xl   | 0 16px 32px -8px oklch(0 0 0 / 0.16) | Toasts (floating notifications) |

## Surface Lightness Model

### Light Mode

| Surface             | Lightness (L) | Example           |
| ------------------- | ------------- | ----------------- |
| Background (canvas) | 0.945         | Page background   |
| Card/Surface        | 0.99          | Cards, panels     |
| Elevated            | 0.99 + shadow | Dropdowns, modals |

### Dark Mode (ascending lightness)

| Surface    | Lightness (L) | Token     |
| ---------- | ------------- | --------- |
| Background | 0.163         | slate-900 |
| Card       | 0.216         | slate-800 |
| Elevated   | 0.250         | slate-700 |
| Highlight  | 0.283         | slate-600 |

## Rules

- Cards and containers never have shadows. Use 1px border + lightness difference.
- Only floating elements (dropdowns, modals, toasts, popovers) get shadows.
- In dark mode, elevation is communicated by increasing lightness, not by shadows.
- Backdrop blur (2px) is used only on modal overlays.

## Migration Note

Old system applied `shadow-sm` to cards. Remove all card shadows. Cards are differentiated by their near-white background against the gray canvas + 1px border.

<!-- tokens: shadow-none, shadow-sm, shadow-md, shadow-lg, shadow-xl -->
<!-- end:chunk -->
