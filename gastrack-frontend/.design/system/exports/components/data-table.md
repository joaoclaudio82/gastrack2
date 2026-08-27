<!-- chunk:component:data-table -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: REFACTOR - 36px rows, mono for data, sticky header, compact density -->

# Data Table

**Migration action: REFACTOR**

## Row Heights

| Density | Height |
| ------- | ------ |
| Compact | 32px   |
| Default | 36px   |
| Relaxed | 44px   |

## Anatomy

1. Container: `rounded-[2px] border border-border overflow-hidden`
2. Sticky header row: bg-secondary, border-b
3. Body rows
4. Optional footer: bg-secondary, border-t

## Header Cell

```
h-9 px-2 py-1 text-[11px] font-semibold leading-[1.6] tracking-[0.04em] uppercase
text-muted-foreground bg-secondary text-left
```

## Body Cell

```
h-9 px-2 py-1 text-[14px] font-normal leading-[1.5] text-foreground border-b border-border
```

## Numeric Cell (override)

```
font-mono tabular-nums text-right
```

## States

| State    | Visual                                                  |
| -------- | ------------------------------------------------------- |
| Default  | bg-card                                                 |
| Hover    | bg-accent                                               |
| Selected | bg-steel-50 dark:bg-steel-950 border-l-2 border-primary |
| Striped  | even:bg-secondary/50                                    |

## Sortable Header

- Icon: chevron-up/down, 12px, muted-foreground
- Active sort: text-foreground, filled icon
- Click cycles: ascending -> descending -> none
- `aria-sort="ascending|descending|none"`

## Sticky Header

```
sticky top-0 z-sticky bg-secondary
```

## Accessibility

- Native `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- `<th scope="col">` for column headers
- Sortable columns: `aria-sort`
- Selected rows: `aria-selected="true"`
- Pagination announced via `aria-live="polite"`

## Key REFACTOR Changes

- Row height reduced from ~48px to 36px default
- Add font-mono to all numeric data columns
- Add sticky header support (was not sticky)
- Add compact density variant (32px rows)
- Add inline sparkline support for trend columns

<!-- end:chunk -->
