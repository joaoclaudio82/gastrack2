# GasTrack Design System Migration Guide

## Summary of Token Changes

| Token Category        | Old Value      | New Value                                  |
| --------------------- | -------------- | ------------------------------------------ |
| **Primary hue**       | Teal (175)     | Steel Blue (~243)                          |
| **Font family**       | Inter          | IBM Plex Sans (body), IBM Plex Mono (code) |
| **Radius sm**         | 0.125rem (2px) | 2px                                        |
| **Radius md**         | 0.375rem (6px) | 4px                                        |
| **Radius lg**         | 0.5rem (8px)   | 6px                                        |
| **Radius xl**         | 0.75rem (12px) | _removed_                                  |
| **Radius 2xl**        | 1rem (16px)    | _removed_                                  |
| **Shadows**           | rgb-based      | oklch-based, lighter                       |
| **Transition fast**   | 150ms          | 100ms                                      |
| **Transition normal** | 200ms          | 150ms                                      |
| **Transition slow**   | 300ms          | 200ms                                      |
| **Button md height**  | 2.5rem (40px)  | 2.25rem (36px)                             |
| **Button lg height**  | 3rem (48px)    | 2.5rem (40px)                              |
| **Input md height**   | 2.5rem (40px)  | 2.25rem (36px)                             |
| **Input lg height**   | 3rem (48px)    | 2.5rem (40px)                              |

## New Color Scales Added

Six full 11-shade scales are now available as Tailwind utility classes:

- `steel-{50..950}` -- Primary brand scale (aliases `primary-{50..950}`)
- `slate-{50..950}` -- Neutral scale
- `critical-{50..950}` -- Error/danger states
- `warning-{50..950}` -- Warning states
- `success-{50..950}` -- Success states
- `info-{50..950}` -- Informational states

## New Typography Tokens

Font sizes available via `--text-{name}` custom properties:

| Name       | Size | Typical use      |
| ---------- | ---- | ---------------- |
| `overline` | 11px | Overline labels  |
| `caption`  | 12px | Captions, badges |
| `label`    | 13px | Form labels      |
| `body`     | 14px | Body text        |
| `body-lg`  | 15px | Emphasized body  |
| `section`  | 16px | Section headings |
| `title`    | 18px | Card/page titles |
| `page`     | 20px | Page headings    |
| `display`  | 24px | Display headings |

Font weights: 400 (regular), 500 (medium), 600 (semibold)

## Font Installation

IBM Plex Sans and IBM Plex Mono are loaded via Google Fonts in `src/index.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

## Breaking Changes

### 1. Radius scale reduced

`--radius-xl` and `--radius-2xl` are removed. The new scale tops out at `--radius-lg: 6px`. Components using `rounded-xl` or `rounded-2xl` should migrate to `rounded-sm` (2px) or `rounded-md` (4px).

**Note:** Tailwind's built-in `rounded-xl` and `rounded-2xl` utility classes still exist and map to Tailwind defaults (12px, 16px). They will NOT match the design system. For design-system compliance, use `rounded-sm` (2px) or `rounded-md` (4px) for cards and containers.

### 2. Shadow values changed

`--shadow-md` is now lighter and single-layer. Components relying on the old 2-layer md shadow will look slightly different.

### 3. Transition speeds faster

All transitions are 50-100ms faster. Some animation-heavy transitions may feel noticeably snappier.

### 4. Component heights reduced

Buttons and inputs at `md` and `lg` sizes are smaller (36px/40px instead of 40px/48px).

---

## Per-Component Migration Checklist

### `styles.css` (Global)

- [x] Primary colors updated from teal to steel blue
- [x] All 6 color scales added to `@theme`
- [x] Semantic colors (`:root` and `.dark`) updated
- [x] Font family changed to IBM Plex Sans
- [x] `--font-mono` added for code contexts
- [x] Radius scale tightened
- [x] Shadows changed to oklch
- [x] Transitions faster
- [x] Component size tokens updated
- [x] Tank status colors reference new palette
- [x] Typography tokens added
- [x] `.card` class uses `rounded-sm` instead of `rounded-xl`
- [x] `.input-focus` ring color uses steel hue (~243)
- [x] `.card-hoverable` uses `var(--transition-normal)` for duration

### `src/index.html`

- [x] IBM Plex Sans + IBM Plex Mono font links added

---

### Components That Need `rounded-xl` -> `rounded-sm` or `rounded-md` Migration

These components use `rounded-xl` or `rounded-2xl` inline and should be updated to match the new radius scale:

| File                                       | Current       | Recommended  |
| ------------------------------------------ | ------------- | ------------ |
| `auth-layout.component.ts:39`              | `rounded-2xl` | `rounded-md` |
| `sidebar.component.ts:39,58,80,106`        | `rounded-xl`  | `rounded-sm` |
| `header.component.ts:20,59,92`             | `rounded-xl`  | `rounded-sm` |
| `input.component.ts:15`                    | `rounded-xl`  | `rounded-sm` |
| `textarea.component.ts:18`                 | `rounded-xl`  | `rounded-sm` |
| `combobox.component.ts:25`                 | `rounded-xl`  | `rounded-sm` |
| `select.component.ts:29`                   | `rounded-xl`  | `rounded-sm` |
| `multi-select.component.ts:25`             | `rounded-xl`  | `rounded-sm` |
| `date-picker.component.ts:18`              | `rounded-xl`  | `rounded-sm` |
| `data-table.component.ts:9`                | `rounded-xl`  | `rounded-sm` |
| `card.component.ts:5`                      | `rounded-lg`  | `rounded-sm` |
| `pressure-stats.component.ts:17,43,72,104` | `rounded-xl`  | `rounded-sm` |
| `pressure-filters.component.ts:15`         | `rounded-xl`  | `rounded-sm` |
| `settings.component.ts:22,38,81`           | `rounded-xl`  | `rounded-sm` |
| `cylinders.component.ts:74,118`            | `rounded-xl`  | `rounded-sm` |
| `roles.component.ts:37`                    | `rounded-xl`  | `rounded-sm` |
| `profile-view.component.ts:27,55`          | `rounded-xl`  | `rounded-sm` |
| `tank-filters.component.ts:13`             | `rounded-xl`  | `rounded-sm` |
| `cylinders-list.component.ts:119,177`      | `rounded-xl`  | `rounded-sm` |

### Components That Need `rounded-lg` Migration

| File                                        | Current      | Recommended  |
| ------------------------------------------- | ------------ | ------------ |
| `button.component.ts:5`                     | `rounded-lg` | `rounded-sm` |
| `breadcrumb.component.ts:19,59`             | `rounded-lg` | `rounded-sm` |
| `modal.component.ts:12`                     | `rounded-lg` | `rounded-sm` |
| `toast.component.ts:134`                    | `rounded-lg` | `rounded-sm` |
| `pressure-filters.component.ts:25,39,49,60` | `rounded-lg` | `rounded-sm` |
| `roles.component.ts:62,102,108`             | `rounded-lg` | `rounded-sm` |
| `login.component.ts:25`                     | `rounded-lg` | `rounded-sm` |
| `forgot-password.component.ts:27`           | `rounded-lg` | `rounded-sm` |
| `kit-detail.component.ts:96,303,307`        | `rounded-lg` | `rounded-sm` |
| Various equipment modals                    | `rounded-lg` | `rounded-sm` |

### Components That Need Font Updates

| File                                               | Current                          | New                                                                          |
| -------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `app.html:40-51`                                   | `'Inter'` font stack             | `'IBM Plex Sans'` font stack (or remove, since `var(--font-sans)` covers it) |
| `app.html:62-73`                                   | `'Inter Tight'`                  | `'IBM Plex Sans'` (or remove)                                                |
| `pressure-line-chart.component.ts` (6 occurrences) | `'Inter, system-ui, sans-serif'` | `'IBM Plex Sans, system-ui, sans-serif'`                                     |

### Components That Need `duration-*` Updates

The design system transitions are now:

- fast: 100ms
- normal: 150ms
- slow: 200ms

All `duration-200` should become `duration-150`, `duration-300` should become `duration-200`. These are scattered across ~35 component files. A global find-replace is recommended:

- `duration-300` -> `duration-200`
- `duration-200` -> `duration-150`
- `duration-150` -> `duration-100`

**Important:** Run these replacements in order (300->200 first, then 200->150) to avoid double-replacing.

### Components That Keep `rounded-full`

These correctly use `rounded-full` and should NOT be changed:

- `badge` class in `styles.css`
- `header.component.ts:68` (avatar circle)
- `switch.component.ts:15,31` (toggle track/thumb)
- `progress.component.ts:17` (progress bar)
- `oxygen-tank-card.component.ts:63` (progress bar)

---

## Recommended Migration Order

1. **styles.css** -- Already done (this PR)
2. **index.html** -- Already done (font links added)
3. **app.html** -- Update or remove the placeholder template font references
4. **Shared UI components** -- Update radius and duration in:
   - button, input, textarea, select, combobox, multi-select, date-picker
   - card, data-table, modal, toast, badge
   - checkbox, radio-group, switch, progress
5. **Layout components** -- sidebar, header, breadcrumb, auth-layout, dashboard-layout
6. **Feature components** -- pressure-stats, pressure-filters, pressure-line-chart, tank-filters, oxygen-tank-card
7. **Page components** -- settings, cylinders, roles, profile-view, login, forgot-password, etc.

## Verification

After migration, verify:

- [ ] Light and dark mode render correctly
- [ ] All interactive elements have steel-blue focus rings
- [ ] Cards have tight 2px radius (not rounded corners)
- [ ] IBM Plex Sans loads correctly (check Network tab)
- [ ] Tank status colors display correctly in both modes
- [ ] Chart.js font family updated
- [ ] No hardcoded `oklch(... 175)` teal references remain
