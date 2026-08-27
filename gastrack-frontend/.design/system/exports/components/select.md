<!-- chunk:component:select -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius-md, height matches input, steel-500 focus ring -->

# Select

## Sizes

sm (32px), md (36px), lg (40px) -- matches Input heights.

## Trigger

```
h-9 w-full rounded-[4px] border border-input bg-transparent px-2 py-1
text-[14px] font-normal leading-[1.5] text-foreground
flex items-center justify-between
transition-colors duration-[100ms]
focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none
```

## Dropdown

```
rounded-[6px] border border-border bg-popover shadow-sm
py-1 max-h-[240px] overflow-y-auto
```

## Option

```
px-2 py-1.5 text-[14px] text-foreground cursor-pointer
hover:bg-accent rounded-[2px] mx-1
```

Selected option: `bg-accent font-medium` with check icon.

## States

| State    | Visual                             |
| -------- | ---------------------------------- |
| Default  | border-input                       |
| Open     | border-primary ring-2 ring-ring/20 |
| Disabled | opacity-50 cursor-not-allowed      |

## Accessibility

- `role="listbox"` and `role="option"`
- Arrow keys navigate, Enter/Space selects, Escape closes
- Type-ahead search filters options

<!-- end:chunk -->
