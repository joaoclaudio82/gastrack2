<!-- chunk:component:button -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius 4px, IBM Plex Sans 13px medium, height 36px, no shadow -->

# Button

## Variants

primary, secondary, ghost, destructive, outline

## Sizes

| Size | Height | Padding X | Font Size | Icon Size |
| ---- | ------ | --------- | --------- | --------- |
| sm   | 32px   | 12px      | 13px      | 16px      |
| md   | 36px   | 16px      | 13px      | 16px      |
| lg   | 40px   | 20px      | 14px      | 18px      |

## States

| State    | Primary                            | Secondary                              |
| -------- | ---------------------------------- | -------------------------------------- |
| Default  | bg-primary text-primary-foreground | bg-secondary text-secondary-foreground |
| Hover    | bg-steel-600                       | bg-slate-100 dark:bg-slate-600         |
| Active   | bg-steel-700                       | bg-slate-200 dark:bg-slate-500         |
| Focus    | ring-2 ring-ring ring-offset-2     | ring-2 ring-ring ring-offset-2         |
| Disabled | opacity-50 cursor-not-allowed      | opacity-50 cursor-not-allowed          |
| Loading  | opacity-70 cursor-wait + spinner   | opacity-70 cursor-wait + spinner       |

**Ghost:** No background, text-foreground, hover bg-accent.
**Destructive:** bg-destructive text-destructive-foreground, hover bg-critical-600.
**Outline:** border border-input bg-transparent, hover bg-accent.

## Tailwind Classes (primary md)

```
h-9 px-4 rounded-[4px] bg-primary text-primary-foreground text-[13px] font-medium
leading-[1.5] inline-flex items-center justify-center gap-2
transition-colors duration-[100ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
hover:bg-steel-600 active:bg-steel-700 focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
```

## Accessibility

- Native `<button>` element always
- `aria-disabled` when disabled (not just HTML disabled)
- `aria-busy="true"` during loading state
- Minimum 44x44px touch target on mobile
- Visible focus ring on keyboard navigation

## Dark Mode

Primary uses steel-400 as bg. All other tokens switch via CSS custom properties.

<!-- end:chunk -->
