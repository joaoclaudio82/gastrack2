<!-- chunk:component:empty-state -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md -->
<!-- migration: RESTYLE - factual tone, single CTA, muted icon -->

# Empty State

## Anatomy

1. Icon: 40px, muted-foreground, outlined style
2. Title: 16px semibold (section level)
3. Description: 14px, muted-foreground, max 2 lines
4. CTA button: primary or outline, single action only

## Layout

```
flex flex-col items-center justify-center text-center gap-3 py-8
```

## Tone

Factual, not cute.

- DO: "No cylinders found"
- DON'T: "Looks like it is empty here!"

## Accessibility

- CTA button is the primary focus target
- Description provides context for screen readers

<!-- end:chunk -->
