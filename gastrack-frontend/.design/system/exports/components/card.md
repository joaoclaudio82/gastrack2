<!-- chunk:component:card -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, spacing.md, elevation.md, border-radius.md -->
<!-- migration: RESTYLE - radius 2px, remove shadow, 12px padding, 1px border -->

# Card

## Anatomy

Container with optional header, body, footer sections.

## Visual Spec

- Border: 1px solid var(--border)
- Background: var(--card)
- Radius: 2px (radius-sm)
- Padding: 12px (sp-3)
- Shadow: none
- No hover effect by default

## Tailwind Classes

**Container:**

```
rounded-[2px] border border-border bg-card p-3
```

**Header:** `pb-2 border-b border-border`
**Body:** `py-2`
**Footer:** `pt-2 border-t border-border`

**Hoverable variant (for links):**

```
hover:bg-accent transition-colors duration-[100ms] cursor-pointer
```

## Dark Mode

Background switches to slate-800 via --card token. Border becomes slate-600.

## Accessibility

- Use `<article>` or `<section>` with `aria-label`
- Interactive cards use `role="link"` or wrap content in `<a>`

## Migration from Old System

- Remove `shadow-sm` class
- Replace `rounded-xl` with `rounded-[2px]`
- Replace `p-4` / `p-6` with `p-3` (12px)
- Remove `.card-hoverable` shadow transition; keep only bg transition

<!-- end:chunk -->
