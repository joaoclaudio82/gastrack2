<!-- chunk:component:input -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, typography.md, spacing.md, border-radius.md -->
<!-- migration: RESTYLE - radius 4px, height 32/36/40px, steel-500 focus ring -->

# Input

## Variants

default, error, disabled

## Sizes

| Size | Height | Padding X | Font Size |
| ---- | ------ | --------- | --------- |
| sm   | 32px   | 8px       | 13px      |
| md   | 36px   | 8px       | 14px      |
| lg   | 40px   | 12px      | 14px      |

## States

| State    | Visual                                        |
| -------- | --------------------------------------------- |
| Default  | border-input bg-transparent text-foreground   |
| Hover    | border-slate-200 dark:border-slate-500        |
| Focus    | border-primary ring-2 ring-ring/20            |
| Error    | border-destructive ring-2 ring-destructive/20 |
| Disabled | opacity-50 bg-muted cursor-not-allowed        |
| Readonly | bg-muted cursor-default (no focus ring)       |

## Tailwind Classes (default md)

```
h-9 w-full rounded-[4px] border border-input bg-transparent px-2 py-1
text-[14px] font-normal leading-[1.5] text-foreground placeholder:text-muted-foreground
transition-colors duration-[100ms]
hover:border-slate-200 dark:hover:border-slate-500
focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none
disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed
```

## Accessibility

- Always pair with `<label>` using for/id binding
- Error state: `aria-invalid="true"` + `aria-describedby` to error message
- Required: `aria-required="true"`
- Placeholder is not a substitute for a label

## Dark Mode

Border switches to slate-600 via --input token. Focus ring uses steel-400.

<!-- end:chunk -->
