<!-- chunk:component:breadcrumb -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md -->
<!-- migration: NEW - slash-separated path with truncation -->

# Breadcrumb

**Status: NEW component**

## Visual

```
flex items-center gap-1 text-[13px]
```

## Item

```
text-muted-foreground hover:text-foreground transition-colors duration-[100ms]
```

## Separator

`/` character, `text-muted-foreground mx-1`

## Current (last)

```
text-foreground font-medium
```

Not a link.

## Truncation

Middle items collapse to `...` when path exceeds 4 segments.

## Accessibility

- `nav` with `aria-label="Breadcrumb"`
- `<ol>` with `<li>` items
- Current: `aria-current="page"`

<!-- end:chunk -->
