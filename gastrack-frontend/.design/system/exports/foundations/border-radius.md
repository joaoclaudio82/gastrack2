<!-- chunk:foundation:border-radius -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: elevation.md, spacing.md -->

# Border Radius

## Token Scale

| Token       | Value  | Usage                                 |
| ----------- | ------ | ------------------------------------- |
| radius-none | 0px    | Explicit sharp corners                |
| radius-sm   | 2px    | Containers: cards, tables, panels     |
| radius-md   | 4px    | Interactive: buttons, inputs, selects |
| radius-lg   | 6px    | Floating: modals, popovers, dropdowns |
| radius-full | 9999px | Badges, pills, avatars only           |

## Application Rules

| Element Type                      | Radius | Tailwind Class  |
| --------------------------------- | ------ | --------------- |
| Card, table, panel                | 2px    | `rounded-[2px]` |
| Button, input, select, checkbox   | 4px    | `rounded-[4px]` |
| Modal, popover, dropdown, toast   | 6px    | `rounded-[6px]` |
| Badge, avatar, pill, switch track | 9999px | `rounded-full`  |
| Table cell                        | 0px    | (no radius)     |

## Migration Note

Old system used `rounded-xl` (12px) on cards and `rounded-lg` (8px) on interactive elements. The new system is significantly tighter:

| Old                           | New           | Change                                |
| ----------------------------- | ------------- | ------------------------------------- |
| rounded-xl (12px) on cards    | rounded-[2px] | Cards go from 12px to 2px             |
| rounded-lg (8px) on modals    | rounded-[6px] | Modals go from 8px to 6px             |
| rounded-md (6px) on buttons   | rounded-[4px] | Buttons go from 6px to 4px            |
| --radius: 0.5rem (8px) global | Removed       | No global radius; use specific tokens |

Search and replace across all component templates:

- `rounded-xl` -> `rounded-[2px]`
- `rounded-lg` -> `rounded-[6px]` (only on floating elements)
- `rounded-md` -> `rounded-[4px]` (on interactive elements)

<!-- tokens: radius-none, radius-sm, radius-md, radius-lg, radius-full -->
<!-- end:chunk -->
