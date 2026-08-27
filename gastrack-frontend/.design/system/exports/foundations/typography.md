<!-- chunk:foundation:typography -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: color-system.md, spacing.md -->

# Typography

## Font Families

| Token       | Family                        | Usage                                                  |
| ----------- | ----------------------------- | ------------------------------------------------------ |
| --font-sans | IBM Plex Sans (400, 500, 600) | All UI text                                            |
| --font-mono | IBM Plex Mono (400, 500)      | Data values, pressure readings, codes, numeric columns |

## Type Scale

| Level    | Size | Weight | Line Height | Letter Spacing | Usage                           |
| -------- | ---- | ------ | ----------- | -------------- | ------------------------------- |
| Display  | 24px | 600    | 1.2         | -0.01em        | Metric hero values only         |
| Page     | 20px | 600    | 1.2         | -0.01em        | Page titles                     |
| Title    | 18px | 600    | 1.35        | -0.01em        | Card titles, dialog titles      |
| Section  | 16px | 600    | 1.35        | 0              | Section headings                |
| Body LG  | 15px | 400    | 1.5         | 0              | Emphasized body text            |
| Body     | 14px | 400    | 1.5         | 0              | Default body, table cells       |
| Label    | 13px | 500    | 1.5         | 0              | Form labels, nav items, buttons |
| Caption  | 12px | 400    | 1.6         | 0              | Timestamps, helper text         |
| Overline | 11px | 600    | 1.6         | 0.04em         | Section overlines, UPPERCASE    |

## Tailwind Utility Mapping

```
text-display   -> text-[24px] font-semibold leading-[1.2] tracking-tight
text-page      -> text-[20px] font-semibold leading-[1.2] tracking-tight
text-title     -> text-[18px] font-semibold leading-[1.35] tracking-tight
text-section   -> text-[16px] font-semibold leading-[1.35]
text-body-lg   -> text-[15px] font-normal leading-[1.5]
text-body      -> text-[14px] font-normal leading-[1.5]
text-label     -> text-[13px] font-medium leading-[1.5]
text-caption   -> text-[12px] font-normal leading-[1.6]
text-overline  -> text-[11px] font-semibold leading-[1.6] tracking-[0.04em] uppercase
```

## Monospace Usage Rules

IBM Plex Mono is used exclusively for data values that benefit from tabular alignment:

- Pressure readings (e.g., "145.2 bar")
- Cylinder serial numbers
- Timestamps in logs
- Table numeric columns
- Sparkline axis labels

Apply with `font-mono` class. Always use `tabular-nums` for numeric columns.

## Weight Usage

| Weight         | Value         | When to Use                                               |
| -------------- | ------------- | --------------------------------------------------------- |
| Regular (400)  | font-normal   | Body text, captions, descriptions                         |
| Medium (500)   | font-medium   | Labels, nav items, button text, active states             |
| Semibold (600) | font-semibold | Headings (page, title, section), overlines, metric values |

## Rules

- Maximum page title: 20px. No larger text in the UI.
- Display (24px) is reserved for single metric hero values in Metric Blocks.
- Never use bold (700) or black (900) weights.
- Never go below 11px for any text.
- Overline is always uppercase with 0.04em letter-spacing.

<!-- tokens: font-family, font-size, font-weight, line-height, letter-spacing -->
<!-- end:chunk -->
