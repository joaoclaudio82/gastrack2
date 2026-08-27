<!-- chunk:component:metric-block -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: NEW - replaces Stat Card, compact KPI display -->

# Metric Block

**Status: NEW component (replaces Stat Card)**

## Anatomy

1. Label: 11px overline, muted-foreground, uppercase
2. Value: 24px display, font-mono, foreground
3. Trend indicator: sparkline (48x16) or delta badge
4. Secondary info: 12px caption, muted-foreground

## Layout

```
flex flex-col gap-1 p-3 rounded-[2px] border border-border bg-card
```

## Compact Variant

```
p-2
```

## Value Formatting

Always use `font-mono tabular-nums`.

## Trend Badge

- Up: `text-success-600` with up-arrow icon
- Down: `text-critical-600` with down-arrow icon
- Neutral: `text-muted-foreground` with dash icon

## Migration from Stat Card

- Reduce padding from 16-24px to 12px
- Use overline (11px uppercase) for label instead of body text
- Use display (24px mono) for value instead of arbitrary large sizes
- Add sparkline slot for inline trends
- Remove shadow from card container

<!-- end:chunk -->
