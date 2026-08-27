# GasTrack — Codebase Inventory

> Generated: 2026-03-12

## Stack Summary

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Framework   | Angular 21 (standalone, signals, zoneless, OnPush) |
| Styling     | Tailwind CSS 4 (`@theme` in `styles.css`)          |
| Language    | TypeScript 5.9 (strict)                            |
| Charts      | Chart.js + streaming plugin                        |
| Overlays    | Angular CDK                                        |
| Package mgr | Bun                                                |
| Testing     | Vitest + Playwright                                |

## Design Tokens (styles.css)

| Token Category     | Count                 | Format                |
| ------------------ | --------------------- | --------------------- |
| Primary colors     | 11                    | oklch                 |
| Semantic colors    | 8 pairs (light/dark)  | CSS custom properties |
| Tank status colors | 5 states x 3 variants | CSS custom properties |
| Spacing            | 10                    | rem                   |
| Shadows            | 4                     | rgb                   |
| Radius             | 6                     | rem                   |
| Z-index            | 8                     | unitless              |
| Transitions        | 3                     | ms                    |
| Component sizes    | 6                     | rem                   |

## UI Components (shared/components/ui/)

| Component       | File                                         | Notes                 |
| --------------- | -------------------------------------------- | --------------------- |
| Alert           | alert/alert.component.ts                     |                       |
| Avatar          | avatar/avatar.component.ts                   |                       |
| Badge           | badge/badge.component.ts                     |                       |
| Button          | button/button.component.ts                   |                       |
| Calendar        | calendar/calendar.component.ts               |                       |
| Card            | card/card.component.ts                       |                       |
| Checkbox        | checkbox/checkbox.component.ts               |                       |
| Combobox        | combobox/combobox.component.ts               |                       |
| Data Table      | data-table/data-table.component.ts           | + footer component    |
| Date Picker     | date-picker/date-picker.component.ts         |                       |
| Divider         | divider/divider.component.ts                 |                       |
| Empty State     | empty-state/empty-state.component.ts         |                       |
| Form Section    | form-section/form-section.component.ts       |                       |
| Input           | input/input.component.ts                     |                       |
| Loading Spinner | loading-spinner/loading-spinner.component.ts |                       |
| Modal           | modal/modal.component.ts                     |                       |
| Multi Select    | multi-select/multi-select.component.ts       |                       |
| Pagination      | pagination/pagination.component.ts           |                       |
| Popover         | popover/popover.component.ts                 |                       |
| Progress        | progress/progress.component.ts               |                       |
| Radio Group     | radio-group/radio-group.component.ts         |                       |
| Select          | select/select.component.ts                   |                       |
| Skeleton        | skeleton/skeleton.component.ts               |                       |
| Stat Card       | stat-card/stat-card.component.ts             |                       |
| Switch          | switch/switch.component.ts                   |                       |
| Textarea        | textarea/textarea.component.ts               |                       |
| Timeline        | timeline/timeline.component.ts               |                       |
| Toast           | toast/toast.component.ts                     | + container component |
| Activity Item   | activity-item/activity-item.component.ts     |                       |

## Feature Modules

| Feature   | Components | Pages | Status |
| --------- | ---------- | ----- | ------ |
| Auth      | 1          | 5     | Active |
| Dashboard | 0          | 1     | Active |
| Cylinders | 3          | 1     | Active |
| Equipment | 7          | 5     | Active |
| Analytics | 3          | 2     | Active |
| Admin     | 5          | 7     | Active |
| Profile   | 0          | 2     | Active |
| Errors    | 0          | 3     | Active |

## Layout Components

| Layout           | Sub-components              |
| ---------------- | --------------------------- |
| Auth Layout      | (standalone)                |
| Dashboard Layout | Header, Sidebar, Breadcrumb |

## Styling Patterns

- **Color system:** oklch with CSS custom properties + Tailwind `@theme` mapping
- **Dark mode:** `.dark` class toggle with full token override
- **Component classes:** `@layer components` for base patterns (card, badge, input-focus)
- **Utility classes:** `@layer utilities` for tank status utilities
- **Font:** Inter (system fallback chain)
- **Radius:** 0.5rem default, scale from 0.125rem to 9999px
