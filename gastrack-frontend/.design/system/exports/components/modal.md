<!-- chunk:component:modal -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, elevation.md, border-radius.md -->
<!-- migration: REFACTOR - radius-lg (6px), 16px padding, backdrop blur, close button top-right -->

# Modal

**Migration action: REFACTOR**

## Sizes

| Size | Width | Max Height |
| ---- | ----- | ---------- |
| sm   | 400px | 85vh       |
| md   | 540px | 85vh       |
| lg   | 720px | 85vh       |
| full | 95vw  | 95vh       |

## Anatomy

1. Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1040]`
2. Dialog: `rounded-[6px] border border-border bg-card shadow-lg z-[1050]`
3. Header: `p-4 border-b border-border flex items-center justify-between`
4. Body: `p-4 overflow-y-auto`
5. Footer: `p-4 border-t border-border flex justify-end gap-2`
6. Close button: `absolute top-3 right-3` ghost icon button

## Typography

- Title: 18px semibold
- Body: 14px normal

## Animation

- Open: fade backdrop 200ms, scale dialog 0.95->1.0 + fade 150ms
- Close: reverse

## Accessibility

- `role="dialog"` with `aria-modal="true"`
- `aria-labelledby` pointing to title
- Focus trapped inside dialog
- Escape closes
- Return focus to trigger on close

## Key REFACTOR Changes

- Add backdrop blur (was plain overlay)
- Add close button in top-right (was only in footer)
- Reduce radius from rounded-lg to rounded-[6px]
- Standardize padding to 16px (was inconsistent)

<!-- end:chunk -->
