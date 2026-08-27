# GasTrack — Design Brief

## Project Overview

| Field              | Value                                    |
| ------------------ | ---------------------------------------- |
| **Project**        | GasTrack                                 |
| **Type**           | Visual redesign (full app)               |
| **Date**           | 2026-03-12                               |
| **Codebase**       | Existing Angular 21 + Tailwind CSS 4 app |
| **Strategy**       | Refactor — redesign with migration path  |
| **Implementation** | Existing custom design system            |

---

## The Problem

The current GasTrack interface looks AI-generated — polished but generic. It lacks the authentic, purposeful character expected from a professional industrial SaaS platform. Users should open the app and feel "a real designer built this," not "a template was configured."

---

## Brand Personality

| Attribute      | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| **Authentic**  | Feels designed with intent, not generated. Every choice has reason. |
| **Industrial** | Belongs in the world of gas distribution, pipes, pressure, steel.   |
| **Reliable**   | Inspires confidence. This is software a serious company pays for.   |
| **Technical**  | Data-forward, information-dense, functionally honest.               |
| **Efficient**  | No decoration for decoration's sake. Every element earns its place. |

### Not This

- Generic SaaS templates (too clean, too rounded, too "friendly")
- Over-designed dashboards with gratuitous gradients and glass effects
- Overly playful or consumer-app aesthetics
- Cookie-cutter admin panels

### More Like This

- Industrial control systems (SCADA-inspired clarity)
- Fleet management and logistics platforms
- Enterprise monitoring tools (Grafana, Datadog density)
- Professional B2B tools that feel "built, not assembled"

---

## Target Audience

| Segment         | Description                                              |
| --------------- | -------------------------------------------------------- |
| **Primary**     | Gas distribution company operators and managers          |
| **Secondary**   | Field technicians checking cylinder status               |
| **Tertiary**    | Company admins managing users, contracts, and settings   |
| **Environment** | Office desktops, warehouse terminals, possibly low-light |

---

## Design Scope

| Area               | Status       |
| ------------------ | ------------ |
| **Design scope**   | Full app     |
| **Brand identity** | Refresh      |
| **Design system**  | Refactor     |
| **Screens**        | All features |
| **Accessibility**  | WCAG 2.2 AA  |
| **Theme support**  | Light + Dark |
| **Platform**       | Web          |

### Key Screens / Features

- Dashboard home (overview, stats, alerts)
- Cylinder monitoring (list, filters, status cards)
- Analytics (pressure charts, real-time data)
- Equipment management (kits, contracts, devices)
- Admin (companies, addresses, users, roles, settings)
- Auth (login, password reset, account confirmation)
- Profile management

---

## Design Principles

1. **Authenticity over polish** — Character beats perfection. Intentional roughness > generic smoothness.
2. **Data density over whitespace** — Show more, scroll less. Industrial users want information, not air.
3. **Function defines form** — Components exist because they solve a problem, not because a template included them.
4. **Industrial honesty** — Colors, type, and spacing should feel engineered, not decorated.
5. **Consistency is trust** — A reliable system looks reliable. Patterns repeat predictably.

---

## Technical Constraints

| Constraint      | Detail                                               |
| --------------- | ---------------------------------------------------- |
| **Framework**   | Angular 21 (standalone, signals, zoneless)           |
| **Styling**     | Tailwind CSS 4 (`@theme` in `styles.css`)            |
| **Components**  | ~25+ custom UI components in `shared/components/ui/` |
| **Color space** | oklch (already in use)                               |
| **Charts**      | Chart.js with streaming plugin                       |
| **CDK**         | Angular CDK for overlays                             |
| **Fonts**       | Currently Inter — open to change                     |
| **Build**       | esbuild via Angular CLI                              |

---

## Success Criteria

1. A new user opens GasTrack and thinks: "This was designed by a professional — it feels authentic."
2. The interface communicates "industrial gas management" through its visual language, not just its content.
3. Data-heavy screens feel dense but readable — not cramped, not wasteful.
4. The design system is coherent enough that new screens feel native without a designer touching them.
5. Light and dark modes both feel intentional, not one as an afterthought.
