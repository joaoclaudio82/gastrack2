<!-- chunk:foundation:spacing -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: grid.md, typography.md -->

# Spacing

Base unit: 4px. All values are multiples or 1.5x multiples of the base.

## Scale

| Token  | Value | Pixels | Usage                             |
| ------ | ----- | ------ | --------------------------------- |
| sp-0.5 | 2px   | 2      | Inline icon gap, micro adjustment |
| sp-1   | 4px   | 4      | Tight internal padding            |
| sp-1.5 | 6px   | 6      | Badge padding, small gap          |
| sp-2   | 8px   | 8      | Default gap, input padding-x      |
| sp-3   | 12px  | 12     | **Card padding**, section gap     |
| sp-4   | 16px  | 16     | Section padding, grid gutter      |
| sp-5   | 20px  | 20     | Large section gap                 |
| sp-6   | 24px  | 24     | Page section margin               |
| sp-8   | 32px  | 32     | Major section divider             |
| sp-10  | 40px  | 40     | Page top margin                   |
| sp-12  | 48px  | 48     | Large layout gap                  |
| sp-16  | 64px  | 64     | Maximum section gap               |
| sp-24  | 96px  | 96     | Full page vertical rhythm         |

## Component Spacing Defaults

| Context                 | Padding/Gap | Token       |
| ----------------------- | ----------- | ----------- |
| Card padding            | 12px        | sp-3        |
| Card internal gap       | 8px         | sp-2        |
| Form field gap          | 12px        | sp-3        |
| Form section gap        | 16px        | sp-4        |
| Button internal padding | 8px 12px    | sp-2 / sp-3 |
| Table cell padding      | 4px 8px     | sp-1 / sp-2 |
| Modal padding           | 16px        | sp-4        |
| Sidebar item padding    | 8px 12px    | sp-2 / sp-3 |
| Toast padding           | 12px        | sp-3        |
| Page content margin     | 24px        | sp-6        |

## Tailwind Mapping

Spacing tokens map directly to Tailwind's default spacing scale:

- `p-0.5` = 2px, `p-1` = 4px, `p-1.5` = 6px, `p-2` = 8px
- `p-3` = 12px, `p-4` = 16px, `p-5` = 20px, `p-6` = 24px
- `p-8` = 32px, `p-10` = 40px, `p-12` = 48px, `p-16` = 64px

## Rules

- Never use arbitrary spacing values outside the scale (no 5px, 7px, 15px).
- Card padding is always 12px (sp-3). This is a key density decision.
- Table cell padding is always 4px vertical, 8px horizontal.
- The gap between form fields is always 12px.

<!-- tokens: spacing scale sp-0.5 through sp-24 -->
<!-- end:chunk -->
