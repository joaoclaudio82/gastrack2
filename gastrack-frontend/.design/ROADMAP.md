# GasTrack — Design Roadmap

> Started: 2026-03-12

## Phase Overview

| #   | Phase    | Description                                          | Status  |
| --- | -------- | ---------------------------------------------------- | ------- |
| 1   | Research | Trend analysis, competitive audit, industrial refs   | pending |
| 2   | Brand    | Refined identity, color, typography, visual language | pending |
| 3   | System   | Design tokens, foundations, component specifications | pending |
| 4   | Screens  | Screen designs for all key flows                     | pending |
| 5   | Specs    | Implementation specs mapped to Angular components    | pending |
| 6   | Review   | Heuristic evaluation + accessibility audit           | pending |
| 7   | Build    | Translate designs to production code                 | pending |
| 8   | Launch   | Final polish, documentation, handoff                 | pending |

---

## Phase Details

### Phase 1 — Research (`/gsp:research`)

- Analyze industrial SaaS design trends
- Competitive audit: SCADA interfaces, fleet management, logistics platforms
- Collect reference examples of authentic industrial web apps
- Identify patterns that distinguish "designed" from "templated"

### Phase 2 — Brand (`/gsp:brand`)

- Refine brand personality and visual direction
- Explore typography alternatives (replace Inter with something with more character)
- Evolve color palette — keep teal roots but add industrial depth
- Define iconography style and visual motifs
- Establish photography/illustration direction (if applicable)

### Phase 3 — System (`/gsp:system`)

- Redesign token foundations (color, type, spacing, radius, shadows)
- Define density scale for information-heavy layouts
- Specify component variants with industrial character
- Create migration mapping from current tokens to new tokens
- Document dark mode token relationships

### Phase 4 — Screens (`/gsp:design`)

- Dashboard home
- Cylinder monitoring (list + detail)
- Analytics / pressure charts
- Equipment management (kits, contracts, devices)
- Admin screens (companies, users, roles, settings)
- Auth flows (login, password reset)
- Profile management
- Error pages

### Phase 5 — Specs (`/gsp:spec`)

- Map screen designs to existing Angular components
- Identify components that need modification vs. new components
- Generate implementation specs with Tailwind class mappings
- Define responsive breakpoints and density adaptations

### Phase 6 — Review (`/gsp:review`)

- Nielsen's heuristics evaluation
- WCAG 2.2 AA accessibility audit
- Contrast ratio verification (oklch)
- Keyboard navigation review
- Dark mode consistency check

### Phase 7 — Build (`/gsp:build`)

- Update `styles.css` tokens
- Refactor shared UI components
- Update feature-level components
- Verify light + dark mode
- Run visual regression checks

### Phase 8 — Launch

- Final QA pass
- Update AGENTS.md with new design conventions
- Document design system for future development
- Create before/after comparison
