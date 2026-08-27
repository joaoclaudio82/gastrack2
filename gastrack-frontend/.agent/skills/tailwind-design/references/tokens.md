# Design Tokens Reference

## Colors

### Primary

| Token         | Tailwind      | Hex                  | Usage               |
| ------------- | ------------- | -------------------- | ------------------- |
| Primary       | `blue-600`    | #2563eb              | Main actions, links |
| Primary Hover | `blue-700`    | #1d4ed8              | Hover states        |
| Primary Light | `blue-100`    | #dbeafe              | Light backgrounds   |
| Primary Ring  | `blue-500/20` | rgba(59,130,246,0.2) | Focus rings         |

### Status

| Token         | Tailwind      | Hex     | Usage                |
| ------------- | ------------- | ------- | -------------------- |
| Success       | `emerald-500` | #10b981 | Success, FULL tank   |
| Success Light | `emerald-100` | #d1fae5 | Success background   |
| Warning       | `amber-500`   | #f59e0b | Warning, LOW tank    |
| Warning Light | `amber-100`   | #fef3c7 | Warning background   |
| Danger        | `red-500`     | #ef4444 | Error, CRITICAL tank |
| Danger Light  | `red-100`     | #fee2e2 | Error background     |
| Info          | `blue-500`    | #3b82f6 | Info messages        |
| Info Light    | `blue-100`    | #dbeafe | Info background      |

### Neutrals

| Token            | Tailwind   | Hex     | Usage                   |
| ---------------- | ---------- | ------- | ----------------------- |
| Text Primary     | `gray-900` | #111827 | Headings, primary text  |
| Text Secondary   | `gray-600` | #4b5563 | Body text, descriptions |
| Text Muted       | `gray-500` | #6b7280 | Captions, hints         |
| Text Placeholder | `gray-400` | #9ca3af | Input placeholders      |
| Border           | `gray-200` | #e5e7eb | Card borders, dividers  |
| Border Dark      | `gray-300` | #d1d5db | Input borders           |
| Background       | `gray-50`  | #f9fafb | Page background         |
| Surface          | `white`    | #ffffff | Cards, modals           |

### Tank Status

| Status   | Background    | Text          | Icon          |
| -------- | ------------- | ------------- | ------------- |
| FULL     | `emerald-100` | `emerald-800` | `emerald-600` |
| NORMAL   | `blue-100`    | `blue-800`    | `blue-600`    |
| LOW      | `amber-100`   | `amber-800`   | `amber-600`   |
| CRITICAL | `red-100`     | `red-800`     | `red-600`     |
| EMPTY    | `gray-100`    | `gray-800`    | `gray-600`    |

---

## Typography

### Font Family

```css
font-family: Inter, system-ui, sans-serif;
```

### Font Sizes

| Name | Class       | Size     | Line Height | Usage                   |
| ---- | ----------- | -------- | ----------- | ----------------------- |
| XS   | `text-xs`   | 0.75rem  | 1rem        | Labels, captions        |
| SM   | `text-sm`   | 0.875rem | 1.25rem     | Secondary text, buttons |
| Base | `text-base` | 1rem     | 1.5rem      | Body text               |
| LG   | `text-lg`   | 1.125rem | 1.75rem     | Subheadings             |
| XL   | `text-xl`   | 1.25rem  | 1.75rem     | Section titles          |
| 2XL  | `text-2xl`  | 1.5rem   | 2rem        | Page titles             |
| 3XL  | `text-3xl`  | 1.875rem | 2.25rem     | Hero titles             |

### Font Weights

| Name     | Class           | Usage           |
| -------- | --------------- | --------------- |
| Normal   | `font-normal`   | Body text       |
| Medium   | `font-medium`   | Labels, buttons |
| Semibold | `font-semibold` | Subheadings     |
| Bold     | `font-bold`     | Headings        |

---

## Spacing

### Scale

| Name | Class        | Size    | Pixels |
| ---- | ------------ | ------- | ------ |
| 1    | `p-1`, `m-1` | 0.25rem | 4px    |
| 2    | `p-2`, `m-2` | 0.5rem  | 8px    |
| 3    | `p-3`, `m-3` | 0.75rem | 12px   |
| 4    | `p-4`, `m-4` | 1rem    | 16px   |
| 5    | `p-5`, `m-5` | 1.25rem | 20px   |
| 6    | `p-6`, `m-6` | 1.5rem  | 24px   |
| 8    | `p-8`, `m-8` | 2rem    | 32px   |

### Component Spacing

| Component   | Padding       | Gap         |
| ----------- | ------------- | ----------- |
| Card        | `p-4`         | -           |
| Button SM   | `px-3 py-1.5` | -           |
| Button MD   | `px-4 py-2.5` | -           |
| Button LG   | `px-6 py-3`   | -           |
| Input       | `px-4 py-2.5` | -           |
| Form fields | -             | `space-y-4` |
| Card grid   | -             | `gap-4`     |

---

## Border Radius

| Name | Class          | Size     | Usage           |
| ---- | -------------- | -------- | --------------- |
| SM   | `rounded`      | 0.25rem  | Small elements  |
| MD   | `rounded-md`   | 0.375rem | Buttons, inputs |
| LG   | `rounded-lg`   | 0.5rem   | Cards, modals   |
| XL   | `rounded-xl`   | 0.75rem  | Large cards     |
| Full | `rounded-full` | 9999px   | Avatars, pills  |

---

## Shadows

| Name | Class         | Usage             |
| ---- | ------------- | ----------------- |
| SM   | `shadow-sm`   | Cards, inputs     |
| MD   | `shadow-md`   | Dropdowns, hovers |
| LG   | `shadow-lg`   | Modals            |
| None | `shadow-none` | Remove shadow     |

---

## Transitions

```html
<!-- Standard transition -->
transition-all duration-200

<!-- Color only -->
transition-colors duration-200

<!-- Shadow only -->
transition-shadow duration-200
```

---

## Focus States

```html
<!-- Standard focus -->
focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0

<!-- With border color -->
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
```
