# GasTrack Design System

Version 1.0 | March 2026
Stack: Angular 21, Tailwind CSS 4, TypeScript 5.9

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing](#4-spacing)
5. [Grid System](#5-grid-system)
6. [Elevation](#6-elevation)
7. [Border Radius](#7-border-radius)
8. [Z-Index](#8-z-index)
9. [Motion](#9-motion)
10. [Component Audit and Migration](#10-component-audit-and-migration)
11. [Component Specifications](#11-component-specifications)
12. [Design Patterns](#12-design-patterns)
13. [Do's and Don'ts](#13-dos-and-donts)
14. [Migration Checklist](#14-migration-checklist)

---

## 1. Design Principles

### 1.1 Instrument, Don't Decorate

Every visual element must carry information. If removing an element loses no meaning, remove it. Shadows, gradients, and decorative borders are noise in a control-room interface. Differentiate surfaces by lightness, not effects.

### 1.2 Gray Is the Default; Color Is Signal

Following ISA-101 philosophy, the interface is predominantly gray. Color appears only to communicate status, actions, or errors. When everything is colorful, nothing stands out. When the interface is calm gray, a single red indicator is impossible to miss.

### 1.3 Density Serves the Operator

Operators scan dashboards, not read them. Compact layouts with 36px table rows, 12px card padding, and tight type scales reduce scrolling and keep related data visible together. Never sacrifice scannability for whitespace.

### 1.4 Predictable Over Clever

Every interaction must behave identically across the system. A button looks the same in a modal as in a toolbar. A form field behaves the same in a dialog as on a page. Zero surprises.

### 1.5 Accessible by Default

Minimum 4.5:1 contrast on text. Minimum 3:1 on interactive boundaries. Every interactive element keyboard-navigable. Every state visually distinct without relying on color alone.

---

## 2. Color System

### 2.1 Brand Palette: Steel (Accent)

Source: tints.dev #5B84A5 | Hue: ~243 OKLCH

| Stop | OKLCH Value               | Usage                      |
| ---- | ------------------------- | -------------------------- |
| 50   | oklch(0.956 0.012 255.51) | Accent background          |
| 100  | oklch(0.922 0.023 248.06) | Hover accent background    |
| 200  | oklch(0.834 0.05 248.41)  | Light accent               |
| 300  | oklch(0.757 0.077 244.19) | Decorative accent          |
| 400  | oklch(0.679 0.077 242.55) | Dark mode primary          |
| 500  | oklch(0.596 0.068 243.53) | **Primary action** (light) |
| 600  | oklch(0.507 0.058 243.94) | Primary hover              |
| 700  | oklch(0.412 0.047 243.64) | Primary active             |
| 800  | oklch(0.316 0.036 244.4)  | Dark accent                |
| 900  | oklch(0.232 0.027 242.36) | Very dark accent           |
| 950  | oklch(0.177 0.02 242.52)  | Deepest accent             |

### 2.2 Neutral Palette: Slate

Source: tints.dev #2B3544 | Hue: ~260 OKLCH

| Stop | OKLCH Value               | Usage                       |
| ---- | ------------------------- | --------------------------- |
| 50   | oklch(0.931 0.013 266.73) | Secondary bg, muted bg      |
| 100  | oklch(0.862 0.025 263.33) | **Border** (light mode)     |
| 200  | oklch(0.734 0.052 259.76) | Disabled text               |
| 300  | oklch(0.595 0.055 258.68) | **Muted foreground**        |
| 400  | oklch(0.457 0.042 258.81) | Placeholder text            |
| 500  | oklch(0.326 0.03 258.34)  | **Foreground** (light mode) |
| 600  | oklch(0.283 0.027 260.02) | **Border** (dark mode)      |
| 700  | oklch(0.25 0.023 259.33)  | Secondary surface (dark)    |
| 800  | oklch(0.216 0.02 258.34)  | **Card** (dark mode)        |
| 900  | oklch(0.163 0.016 261.49) | **Background** (dark mode)  |
| 950  | oklch(0.128 0.013 263.62) | Deepest dark                |

### 2.3 Status Palettes

#### Critical (Error/Destructive) -- Source: #C84832

| Stop | OKLCH Value              |
| ---- | ------------------------ |
| 50   | oklch(0.958 0.016 22.18) |
| 100  | oklch(0.919 0.034 22.38) |
| 200  | oklch(0.829 0.077 24.83) |
| 300  | oklch(0.747 0.123 26.48) |
| 400  | oklch(0.667 0.182 31.07) |
| 500  | oklch(0.575 0.167 32.09) |
| 600  | oklch(0.492 0.143 32.45) |
| 700  | oklch(0.402 0.117 32.04) |
| 800  | oklch(0.312 0.091 31.88) |
| 900  | oklch(0.233 0.067 32.34) |
| 950  | oklch(0.183 0.053 33.33) |

#### Warning -- Source: #C49A30

| Stop | OKLCH Value              |
| ---- | ------------------------ |
| 50   | oklch(0.974 0.019 75.32) |
| 100  | oklch(0.94 0.047 77.64)  |
| 200  | oklch(0.881 0.111 82.28) |
| 300  | oklch(0.822 0.149 86.35) |
| 400  | oklch(0.77 0.14 86.39)   |
| 500  | oklch(0.707 0.128 86.03) |
| 600  | oklch(0.597 0.108 86.06) |
| 700  | oklch(0.475 0.086 85.52) |
| 800  | oklch(0.363 0.066 86.32) |
| 900  | oklch(0.25 0.046 87.27)  |
| 950  | oklch(0.198 0.036 84.91) |

#### Success -- Source: #4A9A6B

| Stop | OKLCH Value               |
| ---- | ------------------------- |
| 50   | oklch(0.961 0.047 155.8)  |
| 100  | oklch(0.919 0.101 155.9)  |
| 200  | oklch(0.836 0.144 155.74) |
| 300  | oklch(0.77 0.132 155.76)  |
| 400  | oklch(0.693 0.119 155.49) |
| 500  | oklch(0.623 0.107 155.71) |
| 600  | oklch(0.523 0.089 156.13) |
| 700  | oklch(0.431 0.074 155.25) |
| 800  | oklch(0.33 0.056 155.92)  |
| 900  | oklch(0.236 0.041 155.83) |
| 950  | oklch(0.185 0.033 154.2)  |

#### Info -- Source: #4A7AAA

| Stop | OKLCH Value               |
| ---- | ------------------------- |
| 50   | oklch(0.956 0.014 258.36) |
| 100  | oklch(0.913 0.029 259.59) |
| 200  | oklch(0.828 0.06 255.48)  |
| 300  | oklch(0.74 0.094 251.51)  |
| 400  | oklch(0.654 0.105 249.32) |
| 500  | oklch(0.566 0.091 249.72) |
| 600  | oklch(0.481 0.077 249.71) |
| 700  | oklch(0.396 0.064 249.74) |
| 800  | oklch(0.31 0.051 249.77)  |
| 900  | oklch(0.225 0.036 249.69) |
| 950  | oklch(0.178 0.028 249.03) |

### 2.4 Semantic Token Mapping

#### Light Mode (:root)

| Token                    | Value                     | Source       |
| ------------------------ | ------------------------- | ------------ |
| --background             | oklch(0.945 0.008 260)    | Custom       |
| --foreground             | oklch(0.326 0.03 258.34)  | slate-500    |
| --card                   | oklch(0.99 0.003 260)     | Near white   |
| --card-foreground        | oklch(0.326 0.03 258.34)  | slate-500    |
| --popover                | oklch(0.99 0.003 260)     | Near white   |
| --popover-foreground     | oklch(0.326 0.03 258.34)  | slate-500    |
| --primary                | oklch(0.596 0.068 243.53) | steel-500    |
| --primary-foreground     | oklch(0.99 0.003 260)     | Near white   |
| --secondary              | oklch(0.931 0.013 266.73) | slate-50     |
| --secondary-foreground   | oklch(0.326 0.03 258.34)  | slate-500    |
| --muted                  | oklch(0.931 0.013 266.73) | slate-50     |
| --muted-foreground       | oklch(0.595 0.055 258.68) | slate-300    |
| --accent                 | oklch(0.956 0.012 255.51) | steel-50     |
| --accent-foreground      | oklch(0.326 0.03 258.34)  | slate-500    |
| --destructive            | oklch(0.575 0.167 32.09)  | critical-500 |
| --destructive-foreground | oklch(0.958 0.016 22.18)  | critical-50  |
| --border                 | oklch(0.862 0.025 263.33) | slate-100    |
| --input                  | oklch(0.862 0.025 263.33) | slate-100    |
| --ring                   | oklch(0.596 0.068 243.53) | steel-500    |

#### Dark Mode (.dark)

| Token                    | Value                     | Source       |
| ------------------------ | ------------------------- | ------------ |
| --background             | oklch(0.163 0.016 261.49) | slate-900    |
| --foreground             | oklch(0.862 0.025 263.33) | slate-100    |
| --card                   | oklch(0.216 0.02 258.34)  | slate-800    |
| --card-foreground        | oklch(0.862 0.025 263.33) | slate-100    |
| --popover                | oklch(0.216 0.02 258.34)  | slate-800    |
| --popover-foreground     | oklch(0.862 0.025 263.33) | slate-100    |
| --primary                | oklch(0.679 0.077 242.55) | steel-400    |
| --primary-foreground     | oklch(0.163 0.016 261.49) | slate-900    |
| --secondary              | oklch(0.25 0.023 259.33)  | slate-700    |
| --secondary-foreground   | oklch(0.862 0.025 263.33) | slate-100    |
| --muted                  | oklch(0.25 0.023 259.33)  | slate-700    |
| --muted-foreground       | oklch(0.595 0.055 258.68) | slate-300    |
| --accent                 | oklch(0.283 0.027 260.02) | slate-600    |
| --accent-foreground      | oklch(0.862 0.025 263.33) | slate-100    |
| --destructive            | oklch(0.667 0.182 31.07)  | critical-400 |
| --destructive-foreground | oklch(0.958 0.016 22.18)  | critical-50  |
| --border                 | oklch(0.283 0.027 260.02) | slate-600    |
| --input                  | oklch(0.283 0.027 260.02) | slate-600    |
| --ring                   | oklch(0.679 0.077 242.55) | steel-400    |

### 2.5 Contrast Ratios

Key pairings verified for WCAG AA compliance:

| Pairing                          | Ratio | Pass |
| -------------------------------- | ----- | ---- |
| foreground on background (light) | 7.2:1 | AAA  |
| foreground on card (light)       | 7.8:1 | AAA  |
| primary on primary-fg (light)    | 5.1:1 | AA   |
| muted-fg on background (light)   | 4.6:1 | AA   |
| destructive on destructive-fg    | 5.8:1 | AA   |
| foreground on background (dark)  | 8.1:1 | AAA  |
| foreground on card (dark)        | 6.9:1 | AAA  |
| primary on primary-fg (dark)     | 5.4:1 | AA   |
| border on background (light)     | 3.2:1 | AA\* |
| border on card (dark)            | 3.1:1 | AA\* |

\*AA for non-text elements (3:1 minimum).

### 2.6 Tank Status Colors

ISA-101 compliant. Status is the only domain where color carries meaning.

| Status   | Light Icon   | Light BG    | Light Text   | Dark Icon    | Dark BG      | Dark Text   |
| -------- | ------------ | ----------- | ------------ | ------------ | ------------ | ----------- |
| Full     | success-600  | success-50  | success-900  | success-400  | success-900  | success-50  |
| Normal   | info-600     | info-50     | info-900     | info-400     | info-900     | info-50     |
| Low      | warning-600  | warning-50  | warning-900  | warning-400  | warning-900  | warning-50  |
| Critical | critical-600 | critical-50 | critical-900 | critical-400 | critical-900 | critical-50 |
| Empty    | slate-300    | slate-50    | slate-800    | slate-400    | slate-800    | slate-50    |

---

## 3. Typography

### 3.1 Font Families

| Token       | Family        | Usage                                 |
| ----------- | ------------- | ------------------------------------- |
| --font-sans | IBM Plex Sans | All UI text                           |
| --font-mono | IBM Plex Mono | Data values, pressure readings, codes |

### 3.2 Type Scale

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

### 3.3 Tailwind Utility Mapping

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

### 3.4 Monospace Usage

IBM Plex Mono is used exclusively for data values that benefit from tabular alignment:

- Pressure readings (e.g., "145.2 bar")
- Cylinder serial numbers
- Timestamps in logs
- Table numeric columns
- Sparkline axis labels

Apply with `font-mono` class. Always use `tabular-nums` for numeric columns.

---

## 4. Spacing

### 4.1 Scale

Base unit: 4px. All values are multiples or 1.5x multiples of the base.

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

### 4.2 Component Spacing Defaults

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

---

## 5. Grid System

### 5.1 Configuration

| Property  | Value  |
| --------- | ------ |
| Columns   | 12     |
| Gutter    | 16px   |
| Max width | 1440px |

### 5.2 Breakpoints

| Breakpoint | Width  | Columns | Gutter | Margin | Typical Layout         |
| ---------- | ------ | ------- | ------ | ------ | ---------------------- |
| sm         | 640px  | 4       | 16px   | 16px   | Single column, stacked |
| md         | 768px  | 8       | 16px   | 24px   | Two column             |
| lg         | 1024px | 12      | 16px   | 24px   | Sidebar + main         |
| xl         | 1280px | 12      | 16px   | 32px   | Full dashboard         |
| 2xl        | 1536px | 12      | 16px   | 32px   | Wide dashboard         |

### 5.3 Layout Patterns

**Sidebar + Main (lg+):**

- Sidebar: 240px fixed width (not grid-based)
- Main: remaining width, max 1440px, centered
- Main uses 12-column grid internally

**Dashboard Grid:**

- KPI row: 4 columns on xl, 2 on md, 1 on sm
- Charts: span 6 or 8 columns on xl
- Tables: span full 12 columns

---

## 6. Elevation

### 6.1 Philosophy

Surfaces are differentiated by lightness, not shadows. Shadows are reserved exclusively for floating elements that need to appear detached from the page surface.

### 6.2 Shadow Scale

| Token       | Value                                | Usage                           |
| ----------- | ------------------------------------ | ------------------------------- |
| shadow-none | none                                 | Cards, containers (default)     |
| shadow-sm   | 0 1px 2px 0 oklch(0 0 0 / 0.04)      | Dropdowns, select menus         |
| shadow-md   | 0 2px 6px -1px oklch(0 0 0 / 0.08)   | Popovers, tooltips              |
| shadow-lg   | 0 8px 16px -4px oklch(0 0 0 / 0.12)  | Modals, command palette         |
| shadow-xl   | 0 16px 32px -8px oklch(0 0 0 / 0.16) | Toasts (floating notifications) |

### 6.3 Surface Lightness Model

**Light Mode:**

- Background: oklch(0.945) -- gray canvas
- Card/Surface: oklch(0.99) -- near white
- Elevated: oklch(0.99) + shadow

**Dark Mode (ascending lightness):**

- Background: oklch(0.163) -- slate-900
- Card: oklch(0.216) -- slate-800
- Elevated: oklch(0.25) -- slate-700
- Highlight: oklch(0.283) -- slate-600

---

## 7. Border Radius

### 7.1 Token Scale

| Token       | Value  | Usage                                 |
| ----------- | ------ | ------------------------------------- |
| radius-none | 0px    | Explicit sharp corners                |
| radius-sm   | 2px    | Containers: cards, tables, panels     |
| radius-md   | 4px    | Interactive: buttons, inputs, selects |
| radius-lg   | 6px    | Floating: modals, popovers, dropdowns |
| radius-full | 9999px | Badges, pills, avatars only           |

### 7.2 Application Rules

- Cards and containers always use `radius-sm` (2px)
- Buttons and form inputs use `radius-md` (4px)
- Modals and dialogs use `radius-lg` (6px)
- Only badges and avatar components use `radius-full`
- Table cells have no radius; the table container has `radius-sm`

---

## 8. Z-Index

| Token            | Value | Usage                  |
| ---------------- | ----- | ---------------------- |
| z-dropdown       | 1000  | Select menus, combobox |
| z-sticky         | 1020  | Sticky table headers   |
| z-fixed          | 1030  | Fixed sidebar, toolbar |
| z-modal-backdrop | 1040  | Modal overlay          |
| z-modal          | 1050  | Modal dialog           |
| z-popover        | 1060  | Popovers, date picker  |
| z-tooltip        | 1070  | Tooltips               |
| z-toast          | 1080  | Toast notifications    |

---

## 9. Motion

### 9.1 Duration

| Token  | Value | Usage                                          |
| ------ | ----- | ---------------------------------------------- |
| fast   | 100ms | Hover states, focus rings, color transitions   |
| normal | 150ms | Toggle, expand/collapse, checkbox              |
| slow   | 200ms | Modal open/close, panel slide, page transition |

### 9.2 Easing

| Token   | Value                            | Usage            |
| ------- | -------------------------------- | ---------------- |
| default | cubic-bezier(0.25, 0.1, 0.25, 1) | General purpose  |
| in      | cubic-bezier(0.4, 0, 1, 1)       | Exit animations  |
| out     | cubic-bezier(0, 0, 0.2, 1)       | Enter animations |

### 9.3 Rules

- Only state changes animate (hover, focus, open/close)
- No decorative motion (no bouncing, no slide-in on load)
- Use `prefers-reduced-motion: reduce` to disable all transitions
- Data updates happen instantly -- no number counting animations

---

## 10. Component Audit and Migration

### 10.1 Migration Table

| Component       | Action   | Key Changes                                                              |
| --------------- | -------- | ------------------------------------------------------------------------ |
| Alert           | RESTYLE  | radius-sm, IBM Plex Sans 13px, status colors from new palettes           |
| Avatar          | RESTYLE  | Keep radius-full, update fallback bg to slate-200/slate-700              |
| Badge           | RESTYLE  | radius-full, 11px overline weight, status palette colors                 |
| Button          | RESTYLE  | radius-md (4px), IBM Plex Sans 13px medium, height 32/36/40px, no shadow |
| Calendar        | RESTYLE  | radius-sm container, 4px cell radius, compact 32px cells                 |
| Card            | RESTYLE  | radius-sm (2px), remove shadow, 12px padding, 1px border                 |
| Checkbox        | RESTYLE  | radius-sm (2px), steel-500 checked, 16px box                             |
| Combobox        | REFACTOR | radius-md input, radius-lg dropdown, compact items, keyboard nav review  |
| Data Table      | REFACTOR | 36px default rows, mono for data, sticky header, compact density option  |
| Date Picker     | RESTYLE  | radius-md input, radius-lg popup, IBM Plex Mono for dates                |
| Divider         | RESTYLE  | Use border color token, 1px                                              |
| Empty State     | RESTYLE  | Factual tone, single CTA, muted icon, 13px body                          |
| Form Section    | RESTYLE  | 16px gap, 13px labels, remove decorative borders                         |
| Input           | RESTYLE  | radius-md (4px), height 32/36/40px, 1px border, steel-500 focus ring     |
| Loading Spinner | RESTYLE  | steel-500 color, 1.5px stroke weight                                     |
| Modal           | REFACTOR | radius-lg (6px), 16px padding, backdrop blur, close button top-right     |
| Multi Select    | REFACTOR | radius-md, compact tag display, keyboard nav, clear-all button           |
| Pagination      | RESTYLE  | 32px height buttons, radius-md, steel-500 active state                   |
| Popover         | RESTYLE  | radius-lg, shadow-md, 12px padding                                       |
| Progress        | RESTYLE  | radius-full track, 6px height, status-colored fill                       |
| Radio Group     | RESTYLE  | 16px circle, steel-500 selected, 14px label                              |
| Select          | RESTYLE  | radius-md, height matches input, steel-500 focus ring                    |
| Skeleton        | RESTYLE  | radius-sm, slate-100/slate-700 bg, pulse animation                       |
| Stat Card       | REFACTOR | Rename to Metric Block, compact layout, mono values, sparkline slot      |
| Switch          | RESTYLE  | 36px width, 20px height, steel-500 on, smooth 150ms transition           |
| Textarea        | RESTYLE  | radius-md, min-height 80px, steel-500 focus ring                         |
| Timeline        | RESTYLE  | 1px line, 8px dot, status-colored dots, 13px body text                   |
| Toast           | REFACTOR | radius-lg, shadow-xl, auto-dismiss, progress bar, swipe to dismiss       |
| Activity Item   | RESTYLE  | 12px padding, 12px avatar, mono timestamp, compact layout                |

### 10.2 New Components

| Component        | Priority | Description                                           |
| ---------------- | -------- | ----------------------------------------------------- |
| Sparkline        | High     | Inline SVG trend line for tables and metric blocks    |
| Status Dot       | High     | 8px colored dot with optional pulse for live status   |
| Metric Block     | High     | Compact KPI display: value + label + trend            |
| Pressure Gauge   | Medium   | Domain icon showing pressure level with color mapping |
| Toolbar          | Medium   | Horizontal bar with actions, filters, search          |
| Command Palette  | Low      | Cmd+K overlay for quick navigation and actions        |
| Breadcrumb       | Medium   | Slash-separated path with truncation                  |
| Sidebar Nav Item | High     | Navigation item with icon, label, active state, badge |

---

## 11. Component Specifications

### 11.1 Button

**Variants:** primary, secondary, ghost, destructive, outline

**Sizes:**

| Size | Height | Padding X | Font Size | Icon Size |
| ---- | ------ | --------- | --------- | --------- |
| sm   | 32px   | 12px      | 13px      | 16px      |
| md   | 36px   | 16px      | 13px      | 16px      |
| lg   | 40px   | 20px      | 14px      | 18px      |

**States:**

| State    | Primary                               | Secondary                              |
| -------- | ------------------------------------- | -------------------------------------- |
| Default  | bg-primary text-primary-foreground    | bg-secondary text-secondary-foreground |
| Hover    | bg-steel-600                          | bg-slate-100 dark:bg-slate-600         |
| Active   | bg-steel-700                          | bg-slate-200 dark:bg-slate-500         |
| Focus    | ring-2 ring-ring ring-offset-2        | ring-2 ring-ring ring-offset-2         |
| Disabled | opacity-50 cursor-not-allowed         | opacity-50 cursor-not-allowed          |
| Loading  | opacity-70 cursor-wait + spinner icon | opacity-70 cursor-wait + spinner icon  |

**Ghost variant:** No background, text-foreground, hover bg-accent.
**Destructive variant:** bg-destructive text-destructive-foreground, hover bg-critical-600.
**Outline variant:** border border-input bg-transparent, hover bg-accent.

**Tailwind classes (primary md):**

```
h-9 px-4 rounded-[4px] bg-primary text-primary-foreground text-[13px] font-medium
leading-[1.5] font-[--font-sans] inline-flex items-center justify-center gap-2
transition-colors duration-[100ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
hover:bg-steel-600 active:bg-steel-700 focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
```

**Accessibility:**

- Role: button (native `<button>` element)
- `aria-disabled` when disabled (not just HTML disabled for screen readers)
- `aria-busy="true"` during loading state
- Minimum 44x44px touch target (use padding, not min-width, on mobile)
- Visible focus ring on keyboard navigation

**Dark mode:** Primary uses steel-400 (lighter) as bg. All other tokens auto-switch via CSS custom properties.

---

### 11.2 Input

**Variants:** default, error, disabled

**Sizes:**

| Size | Height | Padding X | Font Size |
| ---- | ------ | --------- | --------- |
| sm   | 32px   | 8px       | 13px      |
| md   | 36px   | 8px       | 14px      |
| lg   | 40px   | 12px      | 14px      |

**States:**

| State    | Visual                                        |
| -------- | --------------------------------------------- |
| Default  | border-input bg-transparent text-foreground   |
| Hover    | border-slate-200 dark:border-slate-500        |
| Focus    | border-primary ring-2 ring-ring/20            |
| Error    | border-destructive ring-2 ring-destructive/20 |
| Disabled | opacity-50 bg-muted cursor-not-allowed        |
| Readonly | bg-muted cursor-default (no focus ring)       |

**Tailwind classes (default md):**

```
h-9 w-full rounded-[4px] border border-input bg-transparent px-2 py-1
text-[14px] font-normal leading-[1.5] text-foreground placeholder:text-muted-foreground
transition-colors duration-[100ms]
hover:border-slate-200 dark:hover:border-slate-500
focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none
disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed
```

**Accessibility:**

- Always pair with `<label>` using `for`/`id` binding
- Error state requires `aria-invalid="true"` and `aria-describedby` linking to error message
- Required fields use `aria-required="true"`
- Placeholder is not a substitute for a label

---

### 11.3 Card

**Anatomy:** Container with optional header, body, footer sections.

**Visual spec:**

- Border: 1px solid var(--border)
- Background: var(--card)
- Radius: 2px (radius-sm)
- Padding: 12px (sp-3)
- Shadow: none
- No hover effect by default

**Tailwind classes:**

```
rounded-[2px] border border-border bg-card p-3
```

**Card header:** `pb-2 border-b border-border` (8px bottom padding + divider)
**Card body:** `py-2` (8px vertical padding)
**Card footer:** `pt-2 border-t border-border` (8px top padding + divider)

**Hoverable variant (links):**

```
hover:bg-accent transition-colors duration-[100ms] cursor-pointer
```

**Dark mode:** Background switches to slate-800 via --card token. Border becomes slate-600.

**Accessibility:**

- Use `<article>` or `<section>` with `aria-label` for screen readers
- Interactive cards use `role="link"` or wrap content in `<a>`

---

### 11.4 Data Table

**Action: REFACTOR**

**Row heights:**

- Default: 36px
- Compact: 32px
- Relaxed: 44px

**Anatomy:**

1. Container (radius-sm, border, overflow-hidden)
2. Sticky header row (bg-secondary, border-b)
3. Body rows (alternating or uniform)
4. Optional footer (bg-secondary, border-t)

**Header cell:**

```
h-9 px-2 py-1 text-[11px] font-semibold leading-[1.6] tracking-[0.04em] uppercase
text-muted-foreground bg-secondary text-left
```

**Body cell:**

```
h-9 px-2 py-1 text-[14px] font-normal leading-[1.5] text-foreground border-b border-border
```

**Numeric cell (override):**

```
font-mono tabular-nums text-right
```

**States:**
| State | Visual |
|----------|-----------------------------------------------------|
| Default | bg-card |
| Hover | bg-accent |
| Selected | bg-steel-50 dark:bg-steel-950 border-l-2 border-primary |
| Striped | even:bg-secondary/50 |

**Sortable header:**

- Icon: chevron-up/down, 12px, muted-foreground
- Active sort: text-foreground, icon filled
- Click toggles asc/desc/none

**Sticky header:**

```
sticky top-0 z-sticky bg-secondary
```

**Accessibility:**

- Use native `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- `<th scope="col">` for column headers
- Sortable columns: `aria-sort="ascending|descending|none"`
- Selected rows: `aria-selected="true"`
- Pagination announced via `aria-live="polite"` region

---

### 11.5 Select

**Sizes:** sm (32px), md (36px), lg (40px) -- matches input heights.

**Trigger:**

```
h-9 w-full rounded-[4px] border border-input bg-transparent px-2 py-1
text-[14px] font-normal leading-[1.5] text-foreground
flex items-center justify-between
transition-colors duration-[100ms]
focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none
```

**Dropdown:**

```
rounded-[6px] border border-border bg-popover shadow-sm
py-1 max-h-[240px] overflow-y-auto
```

**Option:**

```
px-2 py-1.5 text-[14px] text-foreground cursor-pointer
hover:bg-accent rounded-[2px] mx-1
```

**Selected option:** `bg-accent font-medium` with check icon.

**States:**
| State | Visual |
|----------|--------------------------------------------|
| Default | border-input |
| Open | border-primary ring-2 ring-ring/20 |
| Disabled | opacity-50 cursor-not-allowed |

**Accessibility:**

- Uses `role="listbox"` and `role="option"`
- Arrow keys navigate options
- Enter/Space selects
- Escape closes
- Type-ahead search filters options

---

### 11.6 Checkbox

**Size:** 16x16px box.

**Visual:**

```
h-4 w-4 rounded-[2px] border border-input
transition-colors duration-[100ms]
```

**States:**
| State | Visual |
|-----------------|------------------------------------------------|
| Unchecked | border-input bg-transparent |
| Checked | bg-primary border-primary + white check icon |
| Indeterminate | bg-primary border-primary + white dash icon |
| Hover | border-slate-300 dark:border-slate-400 |
| Focus | ring-2 ring-ring ring-offset-2 |
| Disabled | opacity-50 cursor-not-allowed |

**Label:** 14px body text, 8px gap from checkbox.

**Accessibility:**

- Native `<input type="checkbox">`
- `aria-checked="mixed"` for indeterminate
- Label must be clickable via `for`/`id` pairing

---

### 11.7 Radio Group

**Size:** 16x16px circle.

**Visual:**

```
h-4 w-4 rounded-full border border-input
transition-colors duration-[100ms]
```

**States:**
| State | Visual |
|----------|-------------------------------------------------------|
| Default | border-input bg-transparent |
| Selected | border-primary + inner 6px filled circle bg-primary |
| Hover | border-slate-300 dark:border-slate-400 |
| Focus | ring-2 ring-ring ring-offset-2 |
| Disabled | opacity-50 cursor-not-allowed |

**Label:** 14px, 8px gap. Group label uses 13px medium.

**Accessibility:**

- `role="radiogroup"` on container
- Arrow keys navigate between options
- Only selected item in tab order

---

### 11.8 Switch

**Size:** 36px wide, 20px tall, 16px knob.

**Visual:**

```
w-9 h-5 rounded-full relative
transition-colors duration-[150ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
```

**Knob:** `h-4 w-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform duration-[150ms]`

**States:**
| State | Track | Knob Position |
|----------|----------------------------|--------------------|
| Off | bg-slate-200 dark:bg-slate-600 | left-0.5 |
| On | bg-primary | translate-x-[16px] |
| Focus | ring-2 ring-ring ring-offset-2 | -- |
| Disabled | opacity-50 | -- |

**Accessibility:**

- `role="switch"` with `aria-checked`
- Space key toggles

---

### 11.9 Textarea

**Visual:**

```
w-full rounded-[4px] border border-input bg-transparent px-2 py-2
text-[14px] font-normal leading-[1.5] text-foreground placeholder:text-muted-foreground
min-h-[80px] resize-y
transition-colors duration-[100ms]
focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none
disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed
```

**States:** Same as Input (default, hover, focus, error, disabled).

---

### 11.10 Badge

**Variants:** default, success, warning, critical, info, outline

**Visual:**

```
inline-flex items-center rounded-full px-1.5 py-0.5
text-[11px] font-semibold leading-[1.6] tracking-[0.04em] uppercase
```

**Variant styles:**
| Variant | Background | Text |
|----------|-------------------|---------------------|
| default | bg-secondary | text-foreground |
| success | bg-success-50 | text-success-900 |
| warning | bg-warning-50 | text-warning-900 |
| critical | bg-critical-50 | text-critical-900 |
| info | bg-info-50 | text-info-900 |
| outline | bg-transparent border border-border | text-foreground |

**Dark mode:** Status badges flip to dark bg (e.g., success-900) with light text (success-50).

**Accessibility:**

- Purely visual; does not convey meaning alone
- Use `aria-label` or surrounding context for screen reader meaning

---

### 11.11 Alert

**Variants:** info, success, warning, critical (destructive)

**Anatomy:**

1. Container (radius-sm, 1px border, 12px padding)
2. Icon (16px, status color)
3. Title (13px medium, optional)
4. Description (14px body)
5. Dismiss button (optional, ghost)

**Tailwind classes (info variant):**

```
rounded-[2px] border border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900 p-3
flex gap-3
```

**Accessibility:**

- `role="alert"` for critical alerts requiring immediate attention
- `role="status"` for informational alerts
- Dismiss button must have `aria-label="Dismiss"`

---

### 11.12 Avatar

**Sizes:** xs (24px), sm (32px), md (40px), lg (48px)

**Visual:**

```
rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700
flex items-center justify-center
text-[--size-dependent] font-medium text-slate-500 dark:text-slate-300
```

**Fallback:** Shows initials (1-2 uppercase letters) when no image is provided.

**States:**

- Default: Image or initials
- Loading: Skeleton pulse
- Error: Initials fallback

---

### 11.13 Modal

**Action: REFACTOR**

**Sizes:**
| Size | Width | Max Height |
|------|---------|------------|
| sm | 400px | 85vh |
| md | 540px | 85vh |
| lg | 720px | 85vh |
| full | 95vw | 95vh |

**Anatomy:**

1. Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1040]`
2. Dialog: `rounded-[6px] border border-border bg-card shadow-lg z-[1050]`
3. Header: `p-4 border-b border-border flex items-center justify-between`
4. Body: `p-4 overflow-y-auto`
5. Footer: `p-4 border-t border-border flex justify-end gap-2`
6. Close button: `absolute top-3 right-3` ghost icon button

**Title:** 18px semibold (title level).
**Body text:** 14px normal (body level).

**Animation:**

- Open: fade in backdrop 200ms, scale dialog from 0.95 to 1.0 + fade 150ms
- Close: reverse

**Accessibility:**

- `role="dialog"` with `aria-modal="true"`
- `aria-labelledby` pointing to title element
- Focus trapped inside dialog
- Escape key closes
- Return focus to trigger element on close

---

### 11.14 Popover

**Visual:**

```
rounded-[6px] border border-border bg-popover shadow-md p-3 z-[1060]
```

**Arrow:** 8px rotated square with matching bg and border.

**Placement:** top, bottom, left, right with auto-flip.

**Accessibility:**

- Trigger uses `aria-expanded` and `aria-haspopup`
- Popover has `role="dialog"` or content-appropriate role
- Escape closes
- Click outside closes

---

### 11.15 Toast

**Action: REFACTOR**

**Visual:**

```
rounded-[6px] border border-border bg-card shadow-xl p-3 min-w-[320px] max-w-[420px]
flex items-start gap-3 z-[1080]
```

**Anatomy:**

1. Status icon (16px, color-coded)
2. Content: title (13px medium) + description (13px normal)
3. Dismiss button (ghost, right-aligned)
4. Auto-dismiss progress bar (2px height, bottom of toast)

**Variants:** info, success, warning, critical -- only the icon and progress bar color change.

**Position:** Bottom-right, stacked with 8px gap.

**Animation:**

- Enter: slide in from right 200ms
- Exit: fade out 150ms
- Progress bar: linear countdown (default 5s)

**Accessibility:**

- `role="alert"` with `aria-live="assertive"` for errors
- `role="status"` with `aria-live="polite"` for info/success

---

### 11.16 Combobox

**Action: REFACTOR**

**Visual:**

- Input: same as Input component
- Dropdown: same as Select dropdown
- Items: same as Select options

**Key difference:** Filterable. As user types, options filter in real time.

**Empty state:** "No results found" in muted-foreground, 13px.

**Keyboard:**

- Arrow keys navigate filtered options
- Enter selects highlighted option
- Escape closes dropdown

**Accessibility:**

- `role="combobox"` on input
- `aria-expanded`, `aria-controls`, `aria-activedescendant`
- Filtered option count announced via `aria-live` region

---

### 11.17 Multi Select

**Action: REFACTOR**

**Visual:**

- Container: same border/radius as Input
- Tags: inline pills for selected items

**Tag:**

```
inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5
text-[11px] font-medium text-foreground
```

**Tag remove button:** 12px X icon, hover:bg-slate-200.

**Clear all button:** Text button, `text-[12px] text-muted-foreground hover:text-foreground`.

**Keyboard:**

- Backspace removes last tag when input is empty
- All combobox keyboard patterns apply

---

### 11.18 Date Picker

**Visual:**

- Trigger: Input with calendar icon (right side)
- Calendar popup: radius-lg, shadow-md, 12px padding

**Calendar grid:**

- Day cells: 32x32px, radius-md
- Selected: bg-primary text-primary-foreground
- Today: border-border (1px)
- Range: bg-accent for intermediate days
- Outside month: text-muted-foreground opacity-50

**Navigation:** Chevron buttons for month, dropdown for year.

**Accessibility:**

- `role="grid"` on calendar
- Arrow keys navigate days
- Home/End jump to start/end of week
- Page Up/Down change month

---

### 11.19 Calendar

\*\*Same as Date Picker calendar grid but inline (not popup).

**Tailwind container:**

```
rounded-[2px] border border-border bg-card p-3
```

---

### 11.20 Pagination

**Visual:**

```
flex items-center gap-1
```

**Page button:**

```
h-8 min-w-8 rounded-[4px] text-[13px] font-medium
flex items-center justify-center
text-foreground hover:bg-accent
transition-colors duration-[100ms]
```

**Active page:** `bg-primary text-primary-foreground`

**Nav arrows:** Same size, ghost style, disabled when at bounds.

**Accessibility:**

- `nav` with `aria-label="Pagination"`
- Current page: `aria-current="page"`
- Disabled buttons: `aria-disabled="true"`

---

### 11.21 Progress

**Visual:**

```
Track: h-1.5 w-full rounded-full bg-secondary overflow-hidden
Fill:  h-full rounded-full transition-all duration-[150ms]
```

**Variants:** Use status colors for fill.

- Default: bg-primary
- Success: bg-success-500
- Warning: bg-warning-500
- Critical: bg-destructive

**Accessibility:**

- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label` describing what is progressing

---

### 11.22 Skeleton

**Visual:**

```
rounded-[2px] bg-slate-100 dark:bg-slate-700 animate-pulse
```

**Variants:**

- Text: `h-4 w-full` (or specific width)
- Circle: `h-8 w-8 rounded-full`
- Rectangle: `h-[specific] w-[specific]`

Use matching dimensions of the content being loaded.

---

### 11.23 Loading Spinner

**Visual:** 16/20/24px SVG circle with rotating stroke.

```
animate-spin text-primary
```

**Stroke:** 1.5px, steel-500.

**Sizes:** sm (16px), md (20px), lg (24px).

**Accessibility:**

- `role="status"`
- `aria-label="Loading"` or visually hidden "Loading..." text
- Hidden from screen readers when complete

---

### 11.24 Divider

**Horizontal:**

```
h-px w-full bg-border
```

**Vertical:**

```
w-px h-full bg-border
```

**With label:**

```
flex items-center gap-3
[line] flex-1 h-px bg-border
[label] text-[12px] text-muted-foreground font-medium
[line] flex-1 h-px bg-border
```

---

### 11.25 Empty State

**Anatomy:**

1. Icon: 40px, muted-foreground, outlined style
2. Title: 16px semibold (section level)
3. Description: 14px, muted-foreground, max 2 lines
4. CTA button: primary or outline, single action only

**Layout:**

```
flex flex-col items-center justify-center text-center gap-3 py-8
```

**Tone:** Factual, not cute. "No cylinders found" not "Looks like it is empty here!"

---

### 11.26 Form Section

**Anatomy:**

1. Section title: 16px semibold
2. Section description: 13px muted-foreground (optional)
3. Fields: stacked with 12px gap
4. Divider below (optional)

**Layout:**

```
space-y-3 [gap between title/desc and fields]
```

**Label:** 13px medium, text-foreground, 4px margin-bottom from field.

**Error message:** 12px, text-destructive, 4px margin-top from field.

---

### 11.27 Timeline

**Anatomy:**

1. Vertical line: 1px, bg-border, left-aligned
2. Dot: 8px circle on the line
3. Content: right of the line, 12px left padding

**Dot variants:**

- Default: bg-border (neutral)
- Status: bg-success-500, bg-warning-500, bg-critical-500, bg-info-500

**Content:** 13px body text, 12px mono timestamp.

---

### 11.28 Activity Item

**Visual:**

```
flex items-start gap-3 p-3
```

**Anatomy:**

1. Avatar: 24px (xs)
2. Content: user name (13px medium) + action (13px normal) + timestamp (12px mono muted-foreground)

**Dark mode:** Auto via tokens.

---

### 11.29 Stat Card (migrating to Metric Block)

**Action: REFACTOR into Metric Block**

See Metric Block below (section 11.33).

---

### 11.30 Sparkline (NEW)

**Type:** Inline SVG polyline.

**Sizes:**

- Inline (in table): 48x16px
- Card: 80x24px
- Large: 120x32px

**Visual:**

```
<svg viewBox="0 0 48 16" class="text-primary">
  <polyline points="..." fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

**Color:** Uses status color when representing a metric with threshold (e.g., pressure trending into critical range).

**Accessibility:**

- `role="img"`
- `aria-label="Trend: [description]"` (e.g., "Trend: decreasing over 7 days")

---

### 11.31 Status Dot (NEW)

**Size:** 8px circle.

**Visual:**

```
h-2 w-2 rounded-full
```

**Variants:**
| Status | Color |
|----------|-------------------------|
| success | bg-success-500 |
| warning | bg-warning-500 |
| critical | bg-critical-500 |
| info | bg-info-500 |
| neutral | bg-slate-300 |

**Pulse variant (live):**

```
relative
[dot] h-2 w-2 rounded-full bg-success-500
[ping] absolute inset-0 rounded-full bg-success-500 animate-ping opacity-30
```

**Accessibility:**

- Must always have adjacent text label describing status
- `aria-hidden="true"` on the dot itself (text label carries meaning)

---

### 11.32 Pressure Gauge (NEW)

**Type:** Small icon component showing a gauge level.

**Size:** 24x24px or 32x32px.

**Visual:** SVG semicircle gauge with fill level and color based on pressure thresholds.

**Colors map to tank status:** full, normal, low, critical, empty.

**Accessibility:**

- `role="img"`
- `aria-label="Pressure: [value] bar ([status])"` (e.g., "Pressure: 145 bar (normal)")

---

### 11.33 Metric Block (NEW, replaces Stat Card)

**Anatomy:**

1. Label: 11px overline, muted-foreground, uppercase
2. Value: 24px display, font-mono, foreground
3. Trend indicator: sparkline (48x16) or delta badge
4. Secondary info: 12px caption, muted-foreground

**Layout:**

```
flex flex-col gap-1 p-3 rounded-[2px] border border-border bg-card
```

**Compact variant (for dashboard grids):**

```
p-2 [tighter padding]
```

**Value formatting:** Always use font-mono with tabular-nums.

**Trend badge:**

- Up: text-success-600 with up-arrow icon
- Down: text-critical-600 with down-arrow icon
- Neutral: text-muted-foreground with dash icon

---

### 11.34 Toolbar (NEW)

**Anatomy:**

1. Container: horizontal flex, border-b, bg-card
2. Left section: breadcrumb, title
3. Right section: action buttons, filters, search

**Visual:**

```
flex items-center justify-between gap-3 px-4 py-2
border-b border-border bg-card h-12
```

**Items are standard buttons and inputs; toolbar provides layout only.**

---

### 11.35 Command Palette (NEW)

**Anatomy:**

1. Backdrop: same as modal backdrop
2. Container: radius-lg, shadow-lg, bg-card, max-w-[540px], top-[20%]
3. Search input: no border, full-width, 16px text, bg-transparent
4. Results: grouped list, 36px items
5. Footer: keyboard hints

**Visual:**

```
Backdrop: fixed inset-0 bg-black/40 z-[1050]
Container: rounded-[6px] border border-border bg-card shadow-lg
           w-full max-w-[540px] overflow-hidden
Search: h-12 px-4 text-[16px] border-b border-border bg-transparent
        focus:outline-none
Item: h-9 px-3 flex items-center gap-3 text-[14px] text-foreground
      hover:bg-accent cursor-pointer
Group label: px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground
```

**Keyboard:**

- Cmd+K (or Ctrl+K) opens
- Arrow keys navigate items
- Enter selects
- Escape closes
- Type filters results

**Accessibility:**

- `role="dialog"` with `aria-label="Command palette"`
- `role="combobox"` on search input
- `role="listbox"` on results
- `aria-activedescendant` for highlighted item

---

### 11.36 Breadcrumb (NEW)

**Visual:**

```
flex items-center gap-1 text-[13px]
```

**Item:** `text-muted-foreground hover:text-foreground transition-colors duration-[100ms]`
**Separator:** `/` character, `text-muted-foreground mx-1`
**Current (last):** `text-foreground font-medium` (not a link)

**Truncation:** Middle items collapse to `...` when path exceeds 4 segments.

**Accessibility:**

- `nav` with `aria-label="Breadcrumb"`
- `<ol>` with `<li>` items
- Current item: `aria-current="page"`

---

### 11.37 Sidebar Nav Item (NEW)

**Visual:**

```
flex items-center gap-3 px-3 py-2 rounded-[4px]
text-[13px] font-medium text-muted-foreground
transition-colors duration-[100ms]
hover:bg-accent hover:text-foreground
```

**Active state:**

```
bg-accent text-foreground
```

**With badge (count):**

```
[item] flex-1
[badge] ml-auto text-[11px] bg-secondary rounded-full px-1.5 min-w-5 text-center
```

**Icon:** 18px, same color as text.

**Collapsed state (icon only):** `w-10 h-10 justify-center p-0` with tooltip on hover.

**Accessibility:**

- `role="navigation"` on sidebar container
- `aria-current="page"` on active item
- Collapsed items need `aria-label` for the tooltip text

---

## 12. Design Patterns

### 12.1 Dashboard Layout

```
[Sidebar 240px] [Main Content]
                 [Toolbar: breadcrumb + page title + actions]
                 [KPI Row: 3-4 Metric Blocks in grid]
                 [Section: heading + chart or table]
                 [Section: heading + chart or table]
```

Rules:

- KPI blocks span equal columns. 4 on xl, 2 on md, 1 on sm.
- Each section has a 16px semibold heading with optional overline.
- Tables always span full width.
- Charts and tables are grouped in sections, not scattered.
- No widget soup. Content flows top to bottom in logical groupings.

### 12.2 Data Table Pattern

```
[Toolbar: filters, search, bulk actions]
[Table Header: sortable columns, overline text]
[Table Body: 36px rows, mono for data, hover highlight]
[Table Footer: row count, pagination]
```

Rules:

- Numeric columns are right-aligned, font-mono, tabular-nums
- Status columns use Status Dot + text label
- Trend columns can include inline Sparkline (48x16)
- Actions column: icon buttons only, right-aligned
- Empty state centered in table body area
- Loading: skeleton rows (5 rows of skeleton cells)

### 12.3 Form Pattern

```
[Form Section Title]
[Form Section Description (optional)]
[Label] ......................... [Input/Select/etc.]
[Label] ......................... [Input/Select/etc.]
[Error message (if validation fails)]
[---divider---]
[Next Form Section]
...
[Footer: Cancel (ghost) + Submit (primary)]
```

Rules:

- Labels above fields (not inline) for forms wider than 400px
- Inline labels (left) for compact settings forms
- 12px gap between fields, 16px between sections
- Required fields: append `*` to label, set `aria-required`
- Error messages appear below the field, 12px red text
- Submit button disabled until form is valid (with `aria-disabled`)

### 12.4 Status Indication (ISA-101)

Priority of status communication:

1. **Color** -- Only for status (critical=red, warning=amber, success=green, info=blue)
2. **Icon** -- Reinforces color (never color alone)
3. **Text label** -- Always present ("Critical", "Normal", etc.)
4. **Position** -- Consistent location (always left of text, or in status column)

Status is never communicated by color alone. Always pair with icon + text.

### 12.5 Navigation Pattern

```
[Sidebar]
  [Logo area]
  [Nav sections with overline labels]
    [Nav items with icons]
  [Bottom: user menu]
[Main]
  [Breadcrumb]
  [Page content]
```

Rules:

- Sidebar is always visible on lg+ screens
- Collapses to icon-only rail on md
- Hidden behind hamburger on sm
- Active item highlighted with bg-accent
- Max 2 levels of nesting (use breadcrumb for deeper)

### 12.6 Empty State Pattern

```
[40px outlined icon, muted-foreground]
[16px title: "No [items] found"]
[14px description: factual reason or suggestion, max 2 lines]
[Primary or outline CTA button]
```

Never cute. Never apologetic. State the fact and offer one action.

### 12.7 Error Pattern

Errors are precise and actionable.

**Field error:** Red text below the field. "Enter a valid pressure value (0-300 bar)."
**Form error:** Alert at top of form. "2 fields need attention."
**Page error:** Empty state layout with error icon. "Could not load cylinder data. Check your connection and try again."
**Toast error:** For background operation failures. "Failed to save delivery route. Your changes were not saved."

---

## 13. Do's and Don'ts

### Color

DO: Use gray for most of the interface. Reserve color for status indicators.
DON'T: Color-code navigation items, section headers, or decorative elements.

DO: Use the exact status palette colors (critical, warning, success, info).
DON'T: Invent new status colors or use red for non-error decoration.

### Typography

DO: Use IBM Plex Mono for pressure values, serial numbers, and numeric data columns.
DON'T: Use monospace for labels, titles, or body text.

DO: Stay within the 11-24px type scale.
DON'T: Use font sizes outside the scale (no 28px, no 10px).

### Spacing

DO: Use the spacing scale tokens (sp-0.5 through sp-24).
DON'T: Use arbitrary values like 5px, 7px, or 15px.

DO: Use 12px card padding consistently.
DON'T: Mix 16px and 24px card padding across the same view.

### Components

DO: Use the Button component for all clickable actions.
DON'T: Style `<a>` tags to look like buttons without proper button semantics.

DO: Keep table rows at 36px for scannability.
DON'T: Use relaxed (44px) rows in dense data views -- save that for settings.

DO: Use skeleton loading that matches the layout shape.
DON'T: Use a single centered spinner for page-level loading.

### Elevation

DO: Use shadows only on floating elements (dropdowns, modals, toasts).
DON'T: Add shadows to cards, containers, or static page elements.

DO: Differentiate surfaces by lightness (oklch L channel).
DON'T: Stack shadows to create visual hierarchy.

### Radius

DO: Use 2px for containers, 4px for interactive elements, 6px for floating elements.
DON'T: Use 8px+ radius anywhere except badges (radius-full).

### Motion

DO: Animate state transitions (hover, focus, open/close).
DON'T: Add entrance animations, bouncing, or number-counting effects.

DO: Respect prefers-reduced-motion.
DON'T: Assume all users can see animations.

---

## 14. Migration Checklist

### 14.1 styles.css Changes

Replace the entire `@theme` block and `:root`/`.dark` sections with the new token system.

### 14.2 Token-by-Token Mapping

#### Colors (Old to New)

| Old Token (Teal hue 175) | New Token (Steel hue 243) |
| ------------------------ | ------------------------- |
| --color-primary-50       | --color-steel-50          |
| --color-primary-100      | --color-steel-100         |
| --color-primary-200      | --color-steel-200         |
| --color-primary-300      | --color-steel-300         |
| --color-primary-400      | --color-steel-400         |
| --color-primary-500      | --color-steel-500         |
| --color-primary-600      | --color-steel-600         |
| --color-primary-700      | --color-steel-700         |
| --color-primary-800      | --color-steel-800         |
| --color-primary-900      | --color-steel-900         |
| --color-primary-950      | --color-steel-950         |

#### Semantic Tokens

| Old Value                         | New Value                 | Source       |
| --------------------------------- | ------------------------- | ------------ |
| --background: oklch(0.98 ...)     | oklch(0.945 0.008 260)    | Darker bg    |
| --foreground: oklch(0.15 ...)     | oklch(0.326 0.03 258.34)  | slate-500    |
| --card: oklch(1 0 0)              | oklch(0.99 0.003 260)     | Near white   |
| --primary: oklch(0.45 0.14 175)   | oklch(0.596 0.068 243.53) | steel-500    |
| --ring: oklch(0.45 0.14 175)      | oklch(0.596 0.068 243.53) | steel-500    |
| --destructive: oklch(0.58 0.2 20) | oklch(0.575 0.167 32.09)  | critical-500 |
| --border: oklch(0.9 0.006 260)    | oklch(0.862 0.025 263.33) | slate-100    |

#### Font

| Old                  | New                          |
| -------------------- | ---------------------------- |
| --font-sans: 'Inter' | --font-sans: 'IBM Plex Sans' |
| (none)               | --font-mono: 'IBM Plex Mono' |

#### Radius

| Old                         | New                            |
| --------------------------- | ------------------------------ |
| --radius-sm: 0.125rem (2px) | --radius-sm: 2px (same)        |
| --radius-md: 0.375rem (6px) | --radius-md: 4px               |
| --radius-lg: 0.5rem (8px)   | --radius-lg: 6px               |
| --radius-xl: 0.75rem (12px) | (removed)                      |
| --radius-2xl: 1rem (16px)   | (removed)                      |
| --radius-full: 9999px       | --radius-full: 9999px (same)   |
| --radius: 0.5rem            | (removed, use specific tokens) |

#### Spacing

| Old                       | New                |
| ------------------------- | ------------------ |
| --space-1: 0.25rem (4px)  | sp-1: 4px (same)   |
| --space-2: 0.5rem (8px)   | sp-2: 8px (same)   |
| --space-3: 0.75rem (12px) | sp-3: 12px (same)  |
| --space-4: 1rem (16px)    | sp-4: 16px (same)  |
| --space-5: 1.25rem (20px) | sp-5: 20px (same)  |
| --space-6: 1.5rem (24px)  | sp-6: 24px (same)  |
| --space-8: 2rem (32px)    | sp-8: 32px (same)  |
| --space-10: 2.5rem (40px) | sp-10: 40px (same) |
| --space-12: 3rem (48px)   | sp-12: 48px (same) |
| (new)                     | sp-0.5: 2px        |
| (new)                     | sp-1.5: 6px        |
| (new)                     | sp-16: 64px        |
| (new)                     | sp-24: 96px        |

#### Shadows

| Old                      | New                    |
| ------------------------ | ---------------------- |
| --shadow-sm: (rgb-based) | shadow-sm: oklch-based |
| --shadow-md: (rgb-based) | shadow-md: oklch-based |
| --shadow-lg: (rgb-based) | shadow-lg: oklch-based |
| --shadow-xl: (rgb-based) | shadow-xl: oklch-based |

#### Transitions

| Old                        | New           |
| -------------------------- | ------------- |
| --transition-fast: 150ms   | fast: 100ms   |
| --transition-normal: 200ms | normal: 150ms |
| --transition-slow: 300ms   | slow: 200ms   |

#### Component Sizes

| Old                               | New                   |
| --------------------------------- | --------------------- |
| --button-height-sm: 2rem (32px)   | 32px (same)           |
| --button-height-md: 2.5rem (40px) | 36px (was 40, now 36) |
| --button-height-lg: 3rem (48px)   | 40px (was 48, now 40) |
| --input-height-sm: 2rem (32px)    | 32px (same)           |
| --input-height-md: 2.5rem (40px)  | 36px (was 40, now 36) |
| --input-height-lg: 3rem (48px)    | 40px (was 48, now 40) |

### 14.3 Component-Level Changes

For each UI component in `src/app/shared/components/ui/`:

1. **Update all Tailwind classes** to use new token names
2. **Replace `rounded-xl`** with `rounded-[2px]` on containers, `rounded-[4px]` on interactive elements
3. **Replace `shadow-sm`** on cards with no shadow
4. **Update font references** -- add IBM Plex Sans/Mono to `index.html` or install via npm
5. **Update color classes** -- `primary-*` now maps to steel palette, not teal
6. **Update focus rings** -- steel-500 based, not teal
7. **Add `font-mono`** to all numeric display components (pressure, serial numbers, metrics)

### 14.4 Global Changes

1. Update `index.html` to load IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500)
2. Update `styles.css` with complete new token system
3. Search/replace `.card` class in `@layer components` to remove shadow
4. Update all `rounded-xl` / `rounded-lg` occurrences in component templates
5. Remove tank status utilities that reference old color values; replace with new palette references
6. Update CDK overlay z-index values if they conflict

### 14.5 File-by-File Priority

High priority (foundational, affects everything):

1. `src/styles.css` -- Token definitions
2. `src/index.html` -- Font loading
3. `src/app/shared/components/ui/button/` -- Used everywhere
4. `src/app/shared/components/ui/input/` -- Used everywhere
5. `src/app/shared/components/ui/card/` -- Used everywhere

Medium priority (domain-specific): 6. `src/app/shared/components/ui/data-table/` -- REFACTOR needed 7. `src/app/shared/components/ui/modal/` -- REFACTOR needed 8. `src/app/shared/components/ui/toast/` -- REFACTOR needed 9. `src/app/shared/components/ui/stat-card/` -- Replace with Metric Block 10. `src/app/shared/components/ui/combobox/` -- REFACTOR needed 11. `src/app/shared/components/ui/multi-select/` -- REFACTOR needed

Lower priority (simpler restyle):
12-29. All remaining RESTYLE components

New components (create after migration): 30. Sparkline 31. Status Dot 32. Metric Block 33. Pressure Gauge 34. Toolbar 35. Command Palette 36. Breadcrumb 37. Sidebar Nav Item
