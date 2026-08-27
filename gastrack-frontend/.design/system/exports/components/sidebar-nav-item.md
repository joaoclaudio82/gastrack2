<!-- chunk:component:sidebar-nav-item -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: NEW - navigation item with icon, label, active state, badge -->

# Sidebar Nav Item

**Status: NEW component**

## Visual

```
flex items-center gap-3 px-3 py-2 rounded-[4px]
text-[13px] font-medium text-muted-foreground
transition-colors duration-[100ms]
hover:bg-accent hover:text-foreground
```

## Active State

```
bg-accent text-foreground
```

## With Badge (count)

```
[item] flex-1
[badge] ml-auto text-[11px] bg-secondary rounded-full px-1.5 min-w-5 text-center
```

## Icon

18px, same color as text. Uses Lucide icons.

## Collapsed State (icon only)

```
w-10 h-10 justify-center p-0
```

With tooltip on hover showing the label text.

## Accessibility

- `role="navigation"` on sidebar container
- `aria-current="page"` on active item
- Collapsed items need `aria-label` for the tooltip text

<!-- end:chunk -->
