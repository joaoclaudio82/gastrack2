# GasTrack Design Critique

Version 1.0 | 2026-03-12
Reviewer: Design Director (GSP Review)
Scope: Design system tokens, global styles, and implemented component code

---

## 1. Nielsen's 10 Heuristics Evaluation

| #   | Heuristic                                               | Score | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Visibility of system status                             | 4     | Strong use of semantic status colors across tank levels (full/normal/low/critical/empty) with distinct hues and dedicated CSS custom properties. The button component surfaces loading state via `aria-busy` and a spinner. Toast notifications use border-left color coding for instant type recognition. One gap: the data-table component shows `hover:shadow-lg` on the entire table wrapper, which is decorative rather than informative -- it does not communicate any system state.                                                                                                                                                                                                                                           |
| 2   | Match between system and real world                     | 5     | The design system deliberately adopts industrial gas vocabulary: "tank status," "pressure," "cylinder," "bar" units. The steel-blue palette evokes industrial piping. ISA-101 philosophy (gray default, color is signal) is well-documented and faithfully implemented. Labels are in Portuguese matching the target audience (Brazilian gas distributors).                                                                                                                                                                                                                                                                                                                                                                          |
| 3   | User control and freedom                                | 4     | Modal supports close-on-escape and close-on-backdrop with configurable flags. Header dropdown closes on escape and click-outside. Cylinder list provides "Limpar filtros" to reset. However, the `deactivateCylinder` action uses `window.confirm()` -- a native browser dialog that cannot be styled, breaks the visual language, and provides no undo path.                                                                                                                                                                                                                                                                                                                                                                        |
| 4   | Consistency and standards                               | 3     | Core UI components (button, card, badge, toast) are well-systematized through CVA variants. However, there are three consistency problems. First, the input component uses `h-10` (40px) for md and `h-12` (48px) for lg, while the design tokens specify `--input-height-md: 2.25rem` (36px) and `--input-height-lg: 2.5rem` (40px) -- the implementation is one size step too large. Second, `shadow-2xl` is used in the modal, sidebar, and header dropdown, but the design system only defines up to `shadow-xl`. Third, there are six remaining instances of `duration-200` that should be `duration-150` or `duration-200` per the new motion tokens (sidebar, dashboard-layout, auth-layout, progress bar, oxygen-tank-card). |
| 5   | Error prevention                                        | 4     | Input component provides clear error states with red border, icon, and `role="alert"`. Required fields are marked with an asterisk and `aria-label="required"`. Filter forms allow clearing. The settings page uses inline toggles that take effect without a dangerous submit. Minor gap: the cylinder deactivation has only a `confirm()` gate with no secondary confirmation or undo.                                                                                                                                                                                                                                                                                                                                             |
| 6   | Recognition rather than recall                          | 4     | Sidebar navigation uses icon + label pairs with active state highlighting (`bg-primary text-primary-foreground`). Tank status badges use color + text + dot indicators for triple encoding. Breadcrumbs provide location context. When sidebar is collapsed, `title` attributes provide tooltip labels. One improvement area: the collapsed sidebar shows "GF" as a logo abbreviation -- this is not immediately recognizable and should show the tank/cylinder icon instead.                                                                                                                                                                                                                                                        |
| 7   | Flexibility and efficiency of use                       | 3     | The filter panel on the cylinders page provides search with debounce, status, company, and address filters -- good for power users. However, there are no keyboard shortcuts, no command palette implementation (despite being specified in the design system exports), and no bulk actions on tables. The sidebar collapse provides density control but has no persistent preference storage visible in the component.                                                                                                                                                                                                                                                                                                              |
| 8   | Aesthetic and minimalist design                         | 4     | The design system's "Instrument, Don't Decorate" principle is well-executed. Cards use `shadow-sm` not dramatic elevation. The 2px radius scale creates a genuinely industrial character distinct from consumer SaaS. Color is reserved for status and actions. The pressure-stats cards are clean with icon + metric + label hierarchy. One issue: `text-4xl font-bold` for stat values is oversized relative to the design system's `--text-display: 1.5rem` (24px) -- `text-4xl` is 36px, 50% larger than spec.                                                                                                                                                                                                                   |
| 9   | Help users recognize, diagnose, and recover from errors | 4     | Input component shows inline error messages with icon and `role="alert"` linked via `aria-describedby`. Error states in the cylinder list use a destructive-colored banner. Toast notifications provide dismiss capability. The error messages from API calls ("Erro ao criar cilindro") are generic -- they do not surface the actual server error to help the user fix the problem.                                                                                                                                                                                                                                                                                                                                                |
| 10  | Help and documentation                                  | 2     | The design system itself is exhaustively documented (SYSTEM.md, IDENTITY.md, CODE.md). However, the application provides no in-app help, tooltips for complex fields, onboarding, or contextual guidance for operators. The settings page has no explanatory text for what "Tempo de Sessao" values mean in practice. For an industrial SaaS tool used by operators who may not be tech-savvy, this is a notable gap.                                                                                                                                                                                                                                                                                                                |

**Overall Score: 37/50**

This is a solid industrial design system implementation that achieves its primary goal: feeling purposeful and engineered rather than generic. The main gaps are in migration completeness (token/implementation mismatches), lack of in-app help for operators, and a few missing power-user features.

---

## 2. Visual Hierarchy

**Type Scale Creates Clear Hierarchy -- With One Deviation**

The nine-step type scale from `--text-overline` (11px) through `--text-display` (24px) provides granular control. The pressure-stats component demonstrates good hierarchy: large metric value, smaller unit suffix, and muted label beneath. However, the stat values use `text-4xl` (36px) which exceeds the design system's maximum of `--text-display` (24px/1.5rem). This creates visual weight that is inconsistent with the system's "density serves the operator" principle.

**Color System Supports Scannability**

The ISA-101-inspired approach works. The gray default surface means status badges, tank indicators, and action buttons stand out by contrast. The tank status color map (success-green for full, info-blue for normal, warning-amber for low, critical-red for critical, slate for empty) provides instant visual scanning of cylinder tables without reading text.

**Spacing Is Consistent**

Cards consistently use `p-6` body padding and `gap-6` grid gutters. Table cells use `px-6 py-4` (though this is slightly generous for a system that specifies 36px default row height -- the `py-4` alone adds 32px of vertical padding).

---

## 3. Typography and Color

**IBM Plex Sans**

Excellent choice for this context. IBM Plex was designed for data-heavy enterprise interfaces. Its open apertures aid readability at small sizes (the system's body is 14px), and its slightly squared counters align with the industrial aesthetic. The mono variant (IBM Plex Mono) is appropriate for device IDs and serial numbers, though it is not yet used in the cylinder table where device IDs and serial numbers are displayed -- a missed opportunity for the `font-mono` token.

**Steel-Blue Tones**

The steel palette at hue ~243 OKLCH successfully communicates "industrial infrastructure" without veering into corporate-blue territory. The desaturated quality (chroma 0.068 at the 500 stop) prevents the primary color from competing with status colors that carry higher chroma (critical-400 at 0.182 chroma). This hierarchy is well-calibrated.

**Color Contrast Assessment**

The OKLCH color space makes contrast analysis more predictable. Key pairings:

- **Primary on primary-foreground (light):** steel-500 (L=0.596) on near-white (L=0.99) -- adequate contrast, approximately 5.5:1.
- **Muted-foreground on card (light):** slate-300 (L=0.595) on near-white (L=0.99) -- approximately 4:1, borderline for body text. This is used for descriptions and secondary text throughout. Needs verification.
- **Foreground in dark mode:** slate-100 (L=0.862) on slate-900 (L=0.163) -- strong contrast, approximately 10:1.
- **Warning-foreground on warning (dark):** warning-950 (L=0.198) on warning-400 (L=0.77) -- this pairing needs careful verification. Dark text on a medium-bright amber could be problematic.
- **Success-foreground on success (dark):** success-950 (L=0.185) on success-400 (L=0.693) -- similar concern.

**Potential Issue:** The dark-mode semantic status color pairings use very dark foreground colors on medium-lightness backgrounds. The `--success-foreground` in dark mode is `oklch(0.185 0.033 154.2)` paired with `--success` at `oklch(0.693 0.119 155.49)`. While the lightness delta is large (0.508), the absolute foreground lightness is very low, which can reduce readability on some displays.

---

## 4. Usability

**Interactive Element Identification**

Buttons are clearly distinguished by variant: primary gets the steel-blue fill, outline gets a border, ghost is transparent with hover state. The `cursor-pointer` class is correctly applied to hoverable cards. Focus rings use `ring-2 ring-ring ring-offset-2` consistently.

**Radius Scale (2px/4px/6px)**

The tight radius scale is one of the strongest design decisions. It creates an immediately distinct visual identity -- this does not look like a Shadcn template or a generic admin panel. At 2px for cards and containers, surfaces read as precisely cut rather than softly rounded. The `rounded-full` exception for badges and progress bars is correctly scoped. The only concern is that at very small viewport sizes, the 2px radius may become indistinguishable from square corners, but this is cosmetic at most.

**Transition Speeds**

The 100ms/150ms/200ms scale is appropriately fast for an industrial tool where operators perform repetitive actions. The 100ms hover transitions feel responsive without being jarring. However, the sidebar still uses `duration-200` for its slide transition -- at 200ms for a 256px panel slide, this is at the design system's "slow" tier, which is correct per spec. The issue is that this should use `var(--transition-slow)` rather than a hardcoded Tailwind class for consistency.

---

## 5. Cognitive Load Analysis

**Data Density Serves Operators**

The cylinder table packs eight columns (device, serial, company/address, status, pressure, updated, situation, actions) into a scannable format. The compound cell for "Empresa / Endereco" stacks two lines to save horizontal space. Status badges use color + text + dot for triple encoding. This density level matches the brief's Grafana/Datadog reference points.

**Navigation Patterns Are Predictable**

The sidebar provides a flat list of 12 navigation items -- this is on the edge of manageable. With role-based filtering (ADMIN, SUPER_ADMIN), most users see fewer items. However, there is no grouping or visual section dividers between "operational" items (Dashboard, Analytics) and "admin" items (Users, Invitations, Settings). As the app grows, this flat list will become harder to scan.

**Settings Page Cognitive Load**

The settings page uses a simple 2-column grid of cards. Each card has a clear title and description. Toggle switches for binary settings are appropriate. The session timeout dropdown provides constrained choices. This is well-designed for low cognitive load.

**Potential Overload: Filter Panel**

The cylinders page filter panel has four inputs in a single row on desktop (search, status, company, address) plus two action buttons. This is dense but appropriate for the target users. The "apply" pattern (requiring an explicit button click for company/address filters while search auto-debounces) introduces inconsistency that could confuse users -- some filters apply immediately, others require a button click.

---

## 6. Strategic Alignment

**Brief Goal 1: "A real designer built this"** -- Achieved. The steel-blue palette, tight radius, IBM Plex Sans, and ISA-101-inspired color philosophy create a cohesive visual language that reads as intentionally designed. The CVA variant system ensures components share DNA.

**Brief Goal 2: "Communicates industrial gas management"** -- Achieved. Tank status vocabulary, pressure units, cylinder iconography, and the restrained color palette all reinforce the domain.

**Brief Goal 3: "Dense but readable"** -- Mostly achieved. The type scale and spacing system support this, but the `text-4xl` deviation in stats cards and the generous `py-4` table cell padding work against maximum density. The design system specifies 36px default table rows, but actual rows render taller due to padding.

**Brief Goal 4: "Coherent enough for new screens"** -- Achieved. The token system, CVA variants, and consistent component API mean a developer can build a new page using existing components and it will fit the system.

**Brief Goal 5: "Light and dark both intentional"** -- Achieved. The dark mode token mapping is complete and thoughtful -- card surfaces use slate-800, backgrounds use slate-900, and primary shifts to steel-400 for adequate contrast.

---

## 7. Prioritized Fixes

### Critical -- Must Fix Before Production

1. **[Input Component]** Height values do not match design tokens. `md` uses `h-10` (40px) but token specifies 36px; `lg` uses `h-12` (48px) but token specifies 40px. This creates misalignment between buttons (correct at h-9/36px for md) and adjacent inputs, breaking form row alignment. Fix: Change input sizes to `md: 'h-9 px-4 text-sm'` and `lg: 'h-10 px-4 text-base'`.

2. **[Cylinders Page]** `window.confirm()` for cylinder deactivation breaks the visual language and provides no undo capability. In an industrial context, accidental deactivation could disrupt monitoring. Fix: Replace with a confirmation modal using the existing `app-modal` component with clear "Desativar" destructive button and "Cancelar" secondary button.

3. **[Dark Mode Status Colors]** The `--success-foreground` and `--warning-foreground` in dark mode use extremely dark values (L=0.185, L=0.198) that may fail WCAG contrast on some displays when paired with their respective background colors. Fix: Audit all dark-mode semantic foreground/background pairings with a contrast checker and adjust foreground lightness values to guarantee 4.5:1 minimum.

### Important -- Should Fix for Good UX

4. **[Sidebar]** Uses `shadow-2xl` which is not defined in the design system token set (system defines up to `shadow-xl`). The sidebar is already differentiated by its `border-r`, making heavy shadow unnecessary and violating the "Instrument, Don't Decorate" principle. Fix: Replace `shadow-2xl` with `shadow-sm` or remove shadow entirely; the border-right provides sufficient separation.

5. **[Sidebar]** Uses hardcoded `duration-200` instead of the design system's transition token. Fix: Replace `duration-200` with a class or custom property referencing `var(--transition-slow)`.

6. **[Modal, Header Dropdown]** Both use `shadow-2xl` which exceeds the design system's shadow scale. Fix: Modal should use `shadow-lg` (specified for modals in the token description). Header dropdown should use `shadow-md` (specified for floating elements).

7. **[Pressure Stats]** Stat values use `text-4xl` (36px) which exceeds `--text-display` (24px), the largest defined size. Fix: Change to `text-2xl` or `text-[1.5rem]` to match the display token, or use `text-3xl` (30px) if a larger size is intentionally desired (and document the exception).

8. **[Sidebar Navigation]** Flat list of 12 items with no visual grouping. As the app grows, scanning efficiency decreases. Fix: Add subtle dividers (a `border-t border-border` with `mt-2 pt-2`) between logical groups: Operations (Dashboard, Analytics, Historico), Management (Pontos de Gas, Kits, Equipamentos, Contratos, Cilindros), Admin (Usuarios, Convites, Enderecos, Empresas, Configuracoes).

9. **[Cylinder Table]** Device IDs and serial numbers are displayed in the default sans-serif font. These are machine-generated identifiers where character distinction matters (0 vs O, 1 vs l). Fix: Apply `font-mono` class to device ID and serial number table cells.

10. **[Data Table]** Table cell padding `px-6 py-4` results in row heights well above the 36px default specified by `--table-row-default`. Fix: Reduce to `px-4 py-2` for compact density matching the design system's intent, or use `px-6 py-2.5` for a slightly more comfortable default.

11. **[Settings Page]** Toggle switches are built with raw HTML/CSS rather than using a shared switch component. This means they do not participate in the design system's component lifecycle and may drift. Fix: Use the existing `SwitchComponent` from the UI library if one exists, or extract the inline toggle into a reusable component.

12. **[Filter Behavior]** The search input auto-applies with debounce, but status/company/address filters require clicking "Aplicar filtros." This mixed mental model creates confusion. Fix: Either make all filters auto-apply (with debounce) or require explicit apply for all (remove search debounce auto-apply).

### Polish -- Nice to Have

13. **[Sidebar Logo]** Collapsed state shows "GF" text instead of the cylinder/tank icon. Fix: Show a small version of the tank SVG icon instead.

14. **[Badge Component]** Default size is `sm` but the design system badge spec suggests `md` as default for general use. Fix: Change `defaultVariants` size to `md`.

15. **[Progress/Tank Card]** Still use `duration-200` for bar fill transitions. Fix: Update to `duration-[var(--transition-slow)]` or `duration-200` (which happens to match the slow token value -- document this).

16. **[Toast Animation]** Slide-in animation uses `0.2s` hardcoded in CSS `@keyframes`. Fix: Use `var(--transition-slow)` for consistency.

17. **[Card Component Body Padding]** Default padding is `p-6` (24px). The design system principle 1.3 specifies "12px card padding" for operator density. Fix: Consider reducing to `p-3` or `p-4` for the default, keeping `p-6` as an explicit "relaxed" option.

---

## 8. Alternative Design Directions

### Direction A: "Control Room" -- Maximum Density, Minimal Chrome

Push the industrial metaphor further toward SCADA/HMI interfaces. Reduce all card padding to 8-12px. Remove card borders and shadows entirely -- differentiate surfaces only by background lightness (a 0.02 OKLCH lightness step). Introduce a fixed status bar at the bottom of the viewport showing system-wide health metrics (total cylinders monitored, alerts count, last sync time). Use the mono typeface for all numeric data, not just identifiers. Add a persistent mini-map or overview panel for the sidebar showing alert counts per section. This direction maximizes information density at the cost of initial approachability, targeting expert operators who spend 8+ hours daily in the tool.

### Direction B: "Field-Ready" -- Progressive Disclosure, Touch-Optimized

Acknowledge that field technicians are a secondary audience checking cylinder status on tablets and phones. Introduce a responsive density system: default to compact density on desktop (current approach) but automatically switch to a touch-friendly density on viewports under 1024px -- larger tap targets (minimum 44px), increased padding, and simplified table views that collapse to card-based lists on mobile. Add a "Quick Status" mode accessible from the header that shows only critical/low cylinders in a large-format card grid optimized for glancing at in a warehouse. Preserve the current industrial aesthetic but layer progressive disclosure on top: summary view by default, detail on demand. This direction broadens the audience without diluting the professional identity.

---

## 9. What Works Well

1. **ISA-101 Color Philosophy.** The "gray is default, color is signal" approach is genuinely differentiated from typical SaaS design. It makes status information immediately scannable and gives the interface a professional calm that inspires confidence.

2. **Tight Radius Scale.** The 2px/4px/6px scale is one of the strongest identity-defining decisions in the system. It instantly distinguishes GasTrack from consumer-oriented tools and communicates precision.

3. **CVA Variant Architecture.** Using `cva` for component variants ensures type-safe, predictable styling composition. The button, card, badge, and input components all follow the same pattern, making the system learnable for developers.

4. **Comprehensive Dark Mode.** The dark mode is not an afterthought. Every semantic token has a deliberate dark mapping, status colors shift to lighter variants for dark backgrounds, and tank status colors invert their foreground/background relationship correctly.

5. **Tank Status Token System.** The five-level tank status (`full`, `normal`, `low`, `critical`, `empty`) with per-level icon, background, and text color tokens is a domain-specific design decision that shows deep understanding of the problem space.

6. **Accessibility Foundation.** Focus rings use consistent `ring-2 ring-ring ring-offset-2`. ARIA attributes are present on interactive elements (`aria-busy`, `aria-disabled`, `aria-expanded`, `aria-label`, `role="alert"`). The input component links errors via `aria-describedby`.

7. **OKLCH Color Space.** Using OKLCH throughout (including shadow colors) provides perceptually uniform color manipulation. This means lightness steps between palette shades feel even, and the dark mode token mapping benefits from predictable lightness inversion.

8. **IBM Plex Sans Selection.** The typeface choice reinforces the industrial identity without sacrificing readability. Its slightly wide proportions aid legibility in dense data tables.
