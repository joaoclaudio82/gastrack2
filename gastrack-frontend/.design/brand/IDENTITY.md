# GasTrack Brand Identity System

Version 1.0 | March 2026
Prepared for GasTrack SaaS Platform

---

## Table of Contents

1. [Brand Strategy](#1-brand-strategy)
2. [Logo Directions](#2-logo-directions)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing, Radius, and Density](#5-spacing-radius-and-density)
6. [Iconography](#6-iconography)
7. [Surface and Elevation](#7-surface-and-elevation)
8. [Motion and Interaction](#8-motion-and-interaction)
9. [Brand Applications](#9-brand-applications)
10. [Brand Book Structure](#10-brand-book-structure)

---

## 1. Brand Strategy

### 1.1 Brand Story

GasTrack exists because oxygen distribution is infrastructure, not logistics. Every cylinder leaving a warehouse carries the implicit promise that pressure will be maintained, supply will be continuous, and lives that depend on that gas will not be interrupted. The companies that manage this distribution have, until now, relied on paper manifests, spreadsheets, and instinct honed over decades on the job.

GasTrack replaces instinct with instrumentation. It does not make the work easier in the way consumer software makes shopping easier. It makes the work visible -- turning pressure readings into decisions, delivery routes into efficiency data, and customer consumption patterns into forecasts. It is a control system for people who already know their domain and need a tool that respects that expertise.

The platform is built for environments where the screen competes with warehouse noise, forklift traffic, and phone calls from customers whose tanks are running low. It is built for 8-hour shifts, not 8-second attention spans. It does not congratulate you for completing a task. It shows you what needs attention and gets out of the way.

**In one sentence:** GasTrack is the control system that makes industrial gas distribution as visible as it is critical.

### 1.2 Brand Archetype: The Sage

GasTrack operates from the Sage archetype -- the trusted advisor who values competence, clarity, and truth above all else. The Sage does not sell. The Sage reveals. It presents data without embellishment, organizes complexity without hiding it, and trusts the operator to make the right decision when given the right information.

**Why not The Ruler?** The Ruler imposes order from above. GasTrack does not command operators -- it equips them. The hierarchy already exists in the distribution company; GasTrack serves it.

**Why not The Creator?** The Creator values self-expression and novelty. GasTrack values reliability and consistency. The interface should feel engineered, not designed. Built, not assembled.

**Sage traits expressed in the product:**

- Information density over visual simplicity (the Sage does not dumb things down)
- Neutral by default, color only for meaning (the Sage does not decorate)
- Consistent patterns across every screen (the Sage is predictable, which builds trust)
- Technical vocabulary without apology (the Sage speaks the language of the domain)

### 1.3 Voice Matrix

GasTrack communicates with the precision of an instrument panel. Every word earns its place.

| Dimension                      | Position           | Rationale                                                                                     |
| ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------- |
| Formal -- Casual               | 70% formal         | Professional but not corporate. No jargon for jargon's sake.                                  |
| Serious -- Playful             | 85% serious        | The domain is critical infrastructure. Levity is inappropriate.                               |
| Respectful -- Irreverent       | 90% respectful     | The operator knows their job. The tool respects that.                                         |
| Enthusiastic -- Matter-of-fact | 90% matter-of-fact | Data speaks. The interface does not editorialize.                                             |
| Technical -- Accessible        | 75% technical      | Domain terms (PSI, bar, cilindro, ponto de gas) are used directly. Generic terms are avoided. |

**Voice Do's:**

- "3 cilindros abaixo de 50 PSI" (direct, quantified, domain-specific)
- "Contrato vence em 12 dias" (factual, actionable)
- "Sem dados de pressao desde 14:32" (precise timestamp, no drama)
- "Erro ao salvar. Tente novamente." (state the problem, state the action)

**Voice Don'ts:**

- "Opa! Algo deu errado" (consumer-app casualness)
- "Parabens! Pedido criado com sucesso!" (celebration for routine tasks)
- "Voce tem certeza que deseja deletar?" (instead: "Deletar cilindro SN-4821? Esta acao e irreversivel.")
- "Nenhum resultado encontrado. Que tal tentar outra busca?" (patronizing)

**Empty state voice:**

- Not: "Nada por aqui ainda!"
- Instead: "Nenhum registro encontrado." followed by a single, specific action link.

**Error state voice:**

- Not: "Ops! Algo inesperado aconteceu."
- Instead: "Falha na conexao com o servidor. Ultima sincronizacao: 14:32."

### 1.4 Messaging Hierarchy

**Primary message (tagline):**
"Controle visivel para distribuicao de gas."

**Supporting messages:**

1. **Visibility** -- "Saiba o estado de cada cilindro, em cada ponto, em tempo real." (The core value proposition: replacing guesswork with instrumentation.)

2. **Reliability** -- "Dados continuos. Alertas precisos. Decisoes fundamentadas." (Building trust through consistency and accuracy.)

3. **Efficiency** -- "Menos visitas desnecessarias. Mais entregas no momento certo." (The business outcome: operational savings through data-driven scheduling.)

4. **Control** -- "Gestao completa de clientes, contratos, equipamentos e entregas em uma plataforma." (The scope: replacing multiple tools and spreadsheets.)

**Proof points:**

- Real-time pressure monitoring with configurable alert thresholds
- Consumption trend analysis for predictive delivery scheduling
- Complete asset tracking from warehouse to customer
- Multi-company support with role-based access control
- Works on desktop terminals, warehouse stations, and mobile devices

---

## 2. Logo Directions

### 2.1 Direction 1: Pressure Gauge Mark (Primary Recommendation)

**Concept:** An abstracted pressure gauge dial reduced to its essential geometry. A circle (the gauge face) with a single angled line (the needle) pointing to the upper-right quadrant, indicating a healthy/full reading. The word "GasTrack" sits to the right in a medium-weight sans-serif, tracked slightly wide.

**Why this works:** The pressure gauge is the single most important instrument in gas distribution. It is immediately recognizable to every person in the industry. By abstracting it to pure geometry rather than illustrating it literally, the mark achieves both domain specificity and scalability.

**Visual construction:**

- Circle: 1.5px stroke, no fill. The gauge housing.
- Needle: A single line from center to approximately 2 o'clock position (roughly 60 degrees from vertical). 2px stroke. Extends to 80% of the circle radius.
- Small circle at center: 3px diameter solid dot. The needle pivot.
- Two subtle tick marks at 9 o'clock (empty) and 12 o'clock (full) positions. 1px stroke.
- Overall proportion: The icon fits in a square bounding box. The logotype extends to the right at approximately 3x the icon width.

**Variations:**

- **Full lockup:** Icon + "GasTrack" logotype. Horizontal orientation. Used at 28px height minimum.
- **Stacked lockup:** Icon above "GasTrack" logotype. Used in square contexts (social, app icon). Minimum 48px.
- **Icon only:** The gauge mark alone. Used at 16px minimum (favicon, nav icon, status bar).
- **Monochrome:** All elements in a single color. Works in foreground color on any background.
- **Reversed:** White on dark surfaces. No modification needed -- the mark is stroke-based and inverts cleanly.

**Usage rules:**

- Minimum clear space: Half the icon diameter on all sides.
- Never fill the circle. It is always a stroke.
- Never rotate the needle to point downward (this communicates empty/critical).
- The needle angle is fixed at 60 degrees from vertical in the logo. It is not a dynamic element.
- Minimum size for full lockup: 120px wide / 28px tall.
- Minimum size for icon only: 16px.

### 2.2 Direction 2: Cylinder Silhouette

**Concept:** A minimal side-view silhouette of a gas cylinder -- the distinctive shoulder curve, straight body, and valve cap rendered in a single continuous outline. "GasTrack" logotype to the right with the "T" slightly emphasized (heavier weight or different color) to subtly suggest a data readout / measurement.

**Why this works:** The gas cylinder is the physical product at the center of the business. Its silhouette is universally recognized in the industry and immediately communicates the domain without explanation. Unlike the gauge, which represents a reading, the cylinder represents the asset itself -- aligning with GasTrack's asset management capabilities.

**Visual construction:**

- Cylinder: Continuous single-stroke outline. Rounded shoulder at top transitioning to straight sides. Flat base with slight chamfer. Small valve protrusion at top center.
- Proportions: Approximately 1:3 width-to-height ratio, matching real oxygen cylinder proportions.
- Stroke weight: 1.5px at reference size (24px icon height).
- The cylinder is always oriented vertically (upright). Never tilted or horizontal.
- Logotype: "GasTrack" in medium weight, tracked +20. The "T" in "Track" optionally rendered 1 weight heavier (semibold vs medium) for subtle emphasis.

**Variations:**

- **Full lockup:** Cylinder icon + logotype. Horizontal. Minimum 130px wide.
- **Stacked:** Cylinder above logotype. Minimum 48px wide.
- **Icon only:** Cylinder silhouette. Works down to 14px height due to simple geometry.
- **Monochrome:** Single color, stroke only.
- **Filled variant:** For small sizes (below 20px), the cylinder can be rendered as a solid fill rather than outline for legibility.

**Usage rules:**

- Cylinder is always upright. Never rotated.
- Minimum clear space: Width of the cylinder on all sides.
- At sizes below 20px, switch from stroke to fill variant.
- Never add detail to the cylinder (labels, color bands, pressure indicators). The logo is the silhouette only.

### 2.3 Direction 3: Data Grid / Pipeline

**Concept:** An abstract mark composed of three horizontal parallel lines of different lengths, connected by a single vertical line on the left -- suggesting both a data readout (like a bar chart or log output) and a pipeline/manifold system. "GasTrack" logotype to the right with monospaced "Track" portion to reinforce the data/monitoring aspect.

**Why this works:** This direction moves away from literal industry imagery toward the data platform identity. It positions GasTrack as a technology product first, gas industry product second. The mark reads as both a pipeline diagram and a data visualization, bridging the physical and digital domains.

**Visual construction:**

- Vertical line on the left: Full height of the mark. 2px stroke.
- Three horizontal lines branching right from the vertical: Different lengths (60%, 85%, 45% of max width). 2px stroke. Evenly spaced vertically.
- Small terminal dots (3px) at the end of each horizontal line, suggesting data points or pipe endpoints.
- The overall shape fits in a roughly 4:3 rectangle.
- Logotype: "Gas" in regular weight sans-serif, "Track" in monospace font (IBM Plex Mono). This typographic split reinforces the dual nature: physical gas industry + digital tracking.

**Variations:**

- **Full lockup:** Mark + logotype. Horizontal. Minimum 140px wide.
- **Stacked:** Mark above logotype. Minimum 52px wide.
- **Icon only:** The pipeline/data mark alone. Minimum 16px.
- **Monochrome:** Single color, all strokes.
- **Animated variant (digital only):** The horizontal lines can extend/retract subtly on page load, suggesting live data flow. Animation duration: 600ms, ease-out, runs once.

**Usage rules:**

- The three horizontal lines must always be different lengths. They never align to the same endpoint.
- Minimum clear space: Height of one line-gap on all sides.
- Never add more than three horizontal lines. The mark is always three.
- The vertical line is always on the left (LTR reading direction).
- Minimum size for full lockup: 140px wide.
- Minimum size for icon: 16px.

### 2.4 Logo Direction Recommendation

**Direction 1 (Pressure Gauge Mark) is the primary recommendation.** It combines domain specificity (every operator knows a pressure gauge) with geometric simplicity (scales to any size). It avoids the literal illustration trap while remaining immediately meaningful to the target audience. The gauge metaphor also extends naturally into the product -- dashboard indicators, status widgets, and loading states can all reference the same visual language.

---

## 3. Color System

### 3.1 Design Philosophy

GasTrack follows ISA-101 color principles adapted for software interfaces:

1. **Gray is the default state.** A surface with no color means "operating normally." This is the inverse of consumer software where colorful = engaging. In industrial interfaces, colorful = something needs attention.

2. **Color is reserved for status.** When color appears, it carries meaning. Red is not decorative -- it means a threshold has been breached. Amber is not an accent -- it means a condition is approaching a limit.

3. **One brand color, used sparingly.** The steel blue accent identifies interactive elements (active navigation, primary actions, selection states) and nothing else. It never competes with status colors.

4. **Dark theme is the primary context.** The interface is designed for control-room conditions first: extended viewing, mixed lighting, reduced eye strain. The light theme is an adaptation, not the other way around.

### 3.2 Neutral Palette (Slate)

The neutral palette uses a cool undertone (hue ~260) with near-zero chroma, producing grays that feel industrial and steel-like without drifting into warm or purple territory.

Generated via tints.dev from base #2B3544.

| Stop | OKLCH                     | Hex Approx | Role                               |
| ---- | ------------------------- | ---------- | ---------------------------------- |
| 50   | oklch(0.931 0.013 266.73) | #E9ECF0    | Light mode: page background        |
| 100  | oklch(0.862 0.025 263.33) | #D1D6DE    | Light mode: secondary background   |
| 200  | oklch(0.734 0.052 259.76) | #A0ABBB    | Light mode: border, disabled text  |
| 300  | oklch(0.595 0.055 258.68) | #6F7D91    | Light mode: placeholder text       |
| 400  | oklch(0.457 0.042 258.81) | #4D5768    | Light mode: secondary text         |
| 500  | oklch(0.326 0.03 258.34)  | #343C4A    | Light mode: primary text           |
| 600  | oklch(0.283 0.027 260.02) | #2B3340    | Dark mode: elevated surface border |
| 700  | oklch(0.250 0.023 259.33) | #252C38    | Dark mode: card/elevated surface   |
| 800  | oklch(0.216 0.02 258.34)  | #1E2530    | Dark mode: secondary surface       |
| 900  | oklch(0.163 0.016 261.49) | #161B24    | Dark mode: page background         |
| 950  | oklch(0.128 0.013 263.62) | #10141B    | Dark mode: deepest background      |

### 3.3 Brand Accent Palette (Steel)

A desaturated steel blue (hue ~243) that reads as industrial and restrained. It never dominates a layout -- it marks the single point of focus.

Generated via tints.dev from base #5B84A5.

| Stop | OKLCH                     | Hex Approx | Role                                                     |
| ---- | ------------------------- | ---------- | -------------------------------------------------------- |
| 50   | oklch(0.956 0.012 255.51) | #EDF2F6    | Subtle selected/active background                        |
| 100  | oklch(0.922 0.023 248.06) | #DDE7EF    | Hover background for interactive items                   |
| 200  | oklch(0.834 0.05 248.41)  | #B5CBE0    | Light mode: focus ring                                   |
| 300  | oklch(0.757 0.077 244.19) | #8DB2D1    | Light mode: active border                                |
| 400  | oklch(0.679 0.077 242.55) | #6D96B8    | Dark mode: primary button, active nav                    |
| 500  | oklch(0.596 0.068 243.53) | #5B84A5    | Base brand color. Light mode: primary button, active nav |
| 600  | oklch(0.507 0.058 243.94) | #476C8C    | Light mode: primary button hover                         |
| 700  | oklch(0.412 0.047 243.64) | #365573    | Light mode: primary button pressed                       |
| 800  | oklch(0.316 0.036 244.4)  | #274059    | Dark mode: subtle brand background                       |
| 900  | oklch(0.232 0.027 242.36) | #1C2E42    | Dark mode: brand tint on surfaces                        |
| 950  | oklch(0.177 0.02 242.52)  | #142132    | Dark mode: deepest brand tint                            |

### 3.4 Status Colors

All status colors follow ISA-101 hierarchy: Critical > Warning > Advisory > Normal. Color is semantic, never decorative.

#### Critical / Alarm (Red, hue ~32)

Generated via tints.dev from base #C84832.

| Stop | OKLCH                    | Hex Approx | Usage                     |
| ---- | ------------------------ | ---------- | ------------------------- |
| 50   | oklch(0.958 0.016 22.18) | #FBF0ED    | Light: critical subtle bg |
| 100  | oklch(0.919 0.034 22.38) | #F5DDD6    | Light: critical bg        |
| 200  | oklch(0.829 0.077 24.83) | #E4B2A1    | Light: critical border    |
| 300  | oklch(0.747 0.123 26.48) | #D48A6F    | Light: critical icon      |
| 400  | oklch(0.667 0.182 31.07) | #CE6440    | Dark: critical text/icon  |
| 500  | oklch(0.575 0.167 32.09) | #B34A2B    | Base critical color       |
| 600  | oklch(0.492 0.143 32.45) | #943A20    | Light: critical text      |
| 700  | oklch(0.402 0.117 32.04) | #762D17    | Light: critical bold text |
| 800  | oklch(0.312 0.091 31.88) | #5A2110    | Dark: critical bg         |
| 900  | oklch(0.233 0.067 32.34) | #40170A    | Dark: critical deep bg    |
| 950  | oklch(0.183 0.053 33.33) | #311107    | Dark: critical deepest bg |

#### Warning (Amber, hue ~86)

Generated via tints.dev from base #C49A30.

| Stop | OKLCH                    | Hex Approx | Usage                    |
| ---- | ------------------------ | ---------- | ------------------------ |
| 50   | oklch(0.974 0.019 75.32) | #FCF7EC    | Light: warning subtle bg |
| 100  | oklch(0.94 0.047 77.64)  | #F5EAD0    | Light: warning bg        |
| 200  | oklch(0.881 0.111 82.28) | #E5CE8F    | Light: warning border    |
| 300  | oklch(0.822 0.149 86.35) | #D4B35A    | Light: warning icon      |
| 400  | oklch(0.77 0.14 86.39)   | #C49A30    | Dark: warning text/icon  |
| 500  | oklch(0.707 0.128 86.03) | #AD8520    | Base warning color       |
| 600  | oklch(0.597 0.108 86.06) | #8C6A14    | Light: warning text      |
| 700  | oklch(0.475 0.086 85.52) | #6B500C    | Light: warning bold text |
| 800  | oklch(0.363 0.066 86.32) | #503B06    | Dark: warning bg         |
| 900  | oklch(0.25 0.046 87.27)  | #372803    | Dark: warning deep bg    |
| 950  | oklch(0.198 0.036 84.91) | #2A1F02    | Dark: warning deepest bg |

#### Success (Green, hue ~155)

Generated via tints.dev from base #4A9A6B. Used sparingly -- ISA-101 reserves green for confirmed safe states, not routine completion.

| Stop | OKLCH                     | Hex Approx | Usage                    |
| ---- | ------------------------- | ---------- | ------------------------ |
| 50   | oklch(0.961 0.047 155.8)  | #E8FAF0    | Light: success subtle bg |
| 100  | oklch(0.919 0.101 155.9)  | #C5F2DA    | Light: success bg        |
| 200  | oklch(0.836 0.144 155.74) | #88E0B2    | Light: success border    |
| 300  | oklch(0.77 0.132 155.76)  | #62CC95    | Light: success icon      |
| 400  | oklch(0.693 0.119 155.49) | #4AB37D    | Dark: success text/icon  |
| 500  | oklch(0.623 0.107 155.71) | #3A9A68    | Base success color       |
| 600  | oklch(0.523 0.089 156.13) | #2D7D52    | Light: success text      |
| 700  | oklch(0.431 0.074 155.25) | #22623F    | Light: success bold text |
| 800  | oklch(0.33 0.056 155.92)  | #17492E    | Dark: success bg         |
| 900  | oklch(0.236 0.041 155.83) | #0E321F    | Dark: success deep bg    |
| 950  | oklch(0.185 0.033 154.2)  | #092618    | Dark: success deepest bg |

#### Info (Blue, hue ~250)

Generated via tints.dev from base #4A7AAA.

| Stop | OKLCH                     | Hex Approx | Usage                 |
| ---- | ------------------------- | ---------- | --------------------- |
| 50   | oklch(0.956 0.014 258.36) | #EDF1F6    | Light: info subtle bg |
| 100  | oklch(0.913 0.029 259.59) | #D8E1ED    | Light: info bg        |
| 200  | oklch(0.828 0.06 255.48)  | #B0C3DA    | Light: info border    |
| 300  | oklch(0.74 0.094 251.51)  | #82A4C8    | Light: info icon      |
| 400  | oklch(0.654 0.105 249.32) | #5D89B5    | Dark: info text/icon  |
| 500  | oklch(0.566 0.091 249.72) | #4A7AAA    | Base info color       |
| 600  | oklch(0.481 0.077 249.71) | #3A6290    | Light: info text      |
| 700  | oklch(0.396 0.064 249.74) | #2C4C74    | Light: info bold text |
| 800  | oklch(0.31 0.051 249.77)  | #203859    | Dark: info bg         |
| 900  | oklch(0.225 0.036 249.69) | #162740    | Dark: info deep bg    |
| 950  | oklch(0.178 0.028 249.03) | #101E32    | Dark: info deepest bg |

### 3.5 Tank Status Colors

Cylinder pressure states map to ISA-101 alarm hierarchy. Each state has a precise meaning tied to configurable PSI thresholds.

| State    | Meaning            | Maps To  | Icon Color (Dark)                   | Icon Color (Light)                  |
| -------- | ------------------ | -------- | ----------------------------------- | ----------------------------------- |
| Full     | Above 90% capacity | Normal   | oklch(0.693 0.119 155.49) (suc-400) | oklch(0.523 0.089 156.13) (suc-600) |
| Normal   | 50-90% capacity    | Advisory | oklch(0.654 0.105 249.32) (inf-400) | oklch(0.481 0.077 249.71) (inf-600) |
| Low      | 20-50% capacity    | Warning  | oklch(0.77 0.14 86.39) (war-400)    | oklch(0.597 0.108 86.06) (war-600)  |
| Critical | Below 20% capacity | Alarm    | oklch(0.667 0.182 31.07) (cri-400)  | oklch(0.492 0.143 32.45) (cri-600)  |
| Empty    | 0% or no signal    | Inactive | oklch(0.457 0.042 258.81) (sla-400) | oklch(0.595 0.055 258.68) (sla-300) |

**Background colors for tank status badges:**

| State    | Dark Mode Background                | Light Mode Background              |
| -------- | ----------------------------------- | ---------------------------------- |
| Full     | oklch(0.236 0.041 155.83) (suc-900) | oklch(0.961 0.047 155.8) (suc-50)  |
| Normal   | oklch(0.225 0.036 249.69) (inf-900) | oklch(0.956 0.014 258.36) (inf-50) |
| Low      | oklch(0.25 0.046 87.27) (war-900)   | oklch(0.974 0.019 75.32) (war-50)  |
| Critical | oklch(0.233 0.067 32.34) (cri-900)  | oklch(0.958 0.016 22.18) (cri-50)  |
| Empty    | oklch(0.216 0.02 258.34) (sla-800)  | oklch(0.931 0.013 266.73) (sla-50) |

### 3.6 Semantic Design Tokens

These are the CSS custom properties that the application consumes. Components never reference palette stops directly -- they reference semantic tokens.

#### Light Mode (:root)

```
/* Backgrounds */
--background:          oklch(0.945 0.008 260)     /* Slightly warmer than slate-50 */
--foreground:          oklch(0.326 0.03 258.34)    /* slate-500 */

/* Surfaces */
--card:                oklch(0.99 0.003 260)       /* Near-white with cool cast */
--card-foreground:     oklch(0.326 0.03 258.34)    /* slate-500 */
--popover:             oklch(0.99 0.003 260)
--popover-foreground:  oklch(0.326 0.03 258.34)

/* Brand */
--primary:             oklch(0.596 0.068 243.53)   /* steel-500 */
--primary-foreground:  oklch(0.99 0.003 260)       /* White-ish */

/* Secondary (neutral interactive) */
--secondary:           oklch(0.931 0.013 266.73)   /* slate-50 */
--secondary-foreground:oklch(0.326 0.03 258.34)    /* slate-500 */

/* Muted (de-emphasized) */
--muted:               oklch(0.931 0.013 266.73)   /* slate-50 */
--muted-foreground:    oklch(0.595 0.055 258.68)   /* slate-300 */

/* Accent (subtle interactive highlight) */
--accent:              oklch(0.956 0.012 255.51)   /* steel-50 */
--accent-foreground:   oklch(0.507 0.058 243.94)   /* steel-600 */

/* Destructive */
--destructive:         oklch(0.575 0.167 32.09)    /* critical-500 */
--destructive-foreground: oklch(0.99 0.003 260)

/* Borders & inputs */
--border:              oklch(0.862 0.025 263.33)   /* slate-100 */
--input:               oklch(0.862 0.025 263.33)   /* slate-100 */
--ring:                oklch(0.596 0.068 243.53)   /* steel-500 */
```

#### Dark Mode (.dark)

```
/* Backgrounds */
--background:          oklch(0.163 0.016 261.49)   /* slate-900 */
--foreground:          oklch(0.862 0.025 263.33)   /* slate-100 */

/* Surfaces */
--card:                oklch(0.216 0.02 258.34)    /* slate-800 */
--card-foreground:     oklch(0.862 0.025 263.33)   /* slate-100 */
--popover:             oklch(0.250 0.023 259.33)   /* slate-700 */
--popover-foreground:  oklch(0.862 0.025 263.33)   /* slate-100 */

/* Brand */
--primary:             oklch(0.679 0.077 242.55)   /* steel-400 */
--primary-foreground:  oklch(0.163 0.016 261.49)   /* slate-900 */

/* Secondary */
--secondary:           oklch(0.250 0.023 259.33)   /* slate-700 */
--secondary-foreground:oklch(0.862 0.025 263.33)   /* slate-100 */

/* Muted */
--muted:               oklch(0.250 0.023 259.33)   /* slate-700 */
--muted-foreground:    oklch(0.595 0.055 258.68)   /* slate-300 */

/* Accent */
--accent:              oklch(0.232 0.027 242.36)   /* steel-900 */
--accent-foreground:   oklch(0.757 0.077 244.19)   /* steel-300 */

/* Destructive */
--destructive:         oklch(0.667 0.182 31.07)    /* critical-400 */
--destructive-foreground: oklch(0.958 0.016 22.18) /* critical-50 */

/* Borders & inputs */
--border:              oklch(0.283 0.027 260.02)   /* slate-600 */
--input:               oklch(0.283 0.027 260.02)   /* slate-600 */
--ring:                oklch(0.679 0.077 242.55)   /* steel-400 */
```

### 3.7 Chart Colors

For data visualization, charts use a desaturated series that avoids collision with status colors. All series colors have similar lightness for visual balance.

| Series | Purpose          | Dark Mode OKLCH           | Light Mode OKLCH          |
| ------ | ---------------- | ------------------------- | ------------------------- |
| 1      | Primary metric   | oklch(0.679 0.077 242.55) | oklch(0.596 0.068 243.53) |
| 2      | Secondary metric | oklch(0.70 0.06 300)      | oklch(0.55 0.06 300)      |
| 3      | Tertiary metric  | oklch(0.70 0.06 180)      | oklch(0.55 0.06 180)      |
| 4      | Quaternary       | oklch(0.70 0.06 50)       | oklch(0.55 0.06 50)       |
| 5      | Quinary          | oklch(0.70 0.06 130)      | oklch(0.55 0.06 130)      |
| 6      | Senary           | oklch(0.70 0.06 340)      | oklch(0.55 0.06 340)      |

Chart series use low chroma (0.06) so they do not compete with status colors (chroma 0.10-0.18). They are distinguished primarily by hue, spaced at roughly 60-degree intervals. The brand steel blue always takes Series 1.

**Chart grid lines:** oklch(0.283 0.027 260.02) dark / oklch(0.862 0.025 263.33) light (same as --border).
**Chart axis labels:** oklch(0.595 0.055 258.68) (slate-300) in both modes.
**Chart tooltip background:** oklch(0.250 0.023 259.33) dark / oklch(0.99 0.003 260) light (same as --popover).

### 3.8 WCAG Contrast Ratios

Key foreground/background pairings verified against WCAG AA (4.5:1 for normal text, 3:1 for large text):

| Pairing                         | Mode  | Ratio  | Passes  |
| ------------------------------- | ----- | ------ | ------- |
| foreground on background        | Light | ~8.5:1 | AA, AAA |
| foreground on background        | Dark  | ~8.2:1 | AA, AAA |
| primary on primary-foreground   | Light | ~5.8:1 | AA      |
| primary on primary-foreground   | Dark  | ~5.2:1 | AA      |
| muted-foreground on background  | Light | ~4.6:1 | AA      |
| muted-foreground on background  | Dark  | ~4.8:1 | AA      |
| critical-400 on critical-900 bg | Dark  | ~5.5:1 | AA      |
| warning-400 on warning-900 bg   | Dark  | ~7.0:1 | AA, AAA |
| critical-600 on critical-50 bg  | Light | ~5.8:1 | AA      |
| warning-600 on warning-50 bg    | Light | ~5.2:1 | AA      |

Note: All ratios are approximate due to OKLCH-to-sRGB gamut mapping. Final values must be verified in-browser after CSS rendering. Use a tool like the Chrome DevTools contrast checker or the `contrast-ratio.com` site with rendered hex values.

### 3.9 Dark Mode Mapping Strategy

Dark mode is not a simple inversion. It follows a specific surface elevation model:

```
Light Mode                    Dark Mode
---------                     ---------
background (L: 0.945)    --> background (L: 0.163)     slate-900
card       (L: 0.99)     --> card       (L: 0.216)     slate-800
popover    (L: 0.99)     --> popover    (L: 0.250)     slate-700
border     (L: 0.862)    --> border     (L: 0.283)     slate-600

foreground (L: 0.326)    --> foreground (L: 0.862)     slate-100

primary    (L: 0.596)    --> primary    (L: 0.679)     Lightened for contrast
destructive(L: 0.575)    --> destructive(L: 0.667)     Lightened for contrast
```

The principle: surfaces get lighter as they elevate (from 900 toward 600), mimicking physical proximity to a light source. Text and interactive elements get lighter to maintain contrast. Brand and status colors shift one stop lighter (500 to 400) to compensate for the darker context.

---

## 4. Typography System

### 4.1 Font Selection

**Primary: IBM Plex Sans**
Selected for its industrial heritage (designed for IBM's systems), excellent readability at small sizes, wide weight range, and technical character. It communicates competence and precision without the generic feel of Inter, Roboto, or Open Sans.

**Data: IBM Plex Mono**
Used for all numerical data, codes, identifiers, and technical readouts. The monospace rhythm creates scannable columns and reinforces the control-room aesthetic. Same design family as IBM Plex Sans ensures visual harmony.

**Why not Inter?** Inter is an excellent typeface. It is also the default for half the SaaS products shipped in the last five years. Switching to IBM Plex immediately distinguishes GasTrack from the "AI-generated" template aesthetic the brief identifies as the core problem.

### 4.2 Font Loading

```html
<!-- Preconnect for performance -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- IBM Plex Sans: 400, 500, 600 -->
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap"
  rel="stylesheet"
/>

<!-- IBM Plex Mono: 400, 500 -->
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

**Tailwind CSS 4 configuration:**

```css
@theme {
  --font-sans: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
}
```

Load only the weights actually used. Do not load italic variants unless a specific feature requires them (none currently do). The `display=swap` strategy ensures text is immediately visible with a system font fallback, then swaps when IBM Plex loads.

### 4.3 Type Scale

The type scale is compact. The largest element on any page is 20px. This is deliberate -- in a data-dense interface, oversized headings waste vertical space that could show more rows, more data, more information.

| Token             | Size | Line Height | Weight   | Font      | Usage                                             |
| ----------------- | ---- | ----------- | -------- | --------- | ------------------------------------------------- |
| `text-page`       | 20px | 28px (1.4)  | 600 semi | Plex Sans | Page titles only. One per page.                   |
| `text-section`    | 16px | 24px (1.5)  | 600 semi | Plex Sans | Section headers within a page.                    |
| `text-subsection` | 14px | 20px (1.43) | 600 semi | Plex Sans | Card titles, group labels.                        |
| `text-body`       | 14px | 20px (1.43) | 400 reg  | Plex Sans | Default body text, descriptions.                  |
| `text-label`      | 13px | 18px (1.38) | 500 med  | Plex Sans | Form labels, table headers, nav items.            |
| `text-caption`    | 12px | 16px (1.33) | 400 reg  | Plex Sans | Timestamps, helper text, footnotes.               |
| `text-overline`   | 11px | 16px (1.45) | 600 semi | Plex Sans | Uppercase category labels. letter-spacing: 0.05em |
| `text-data`       | 14px | 20px (1.43) | 400 reg  | Plex Mono | Table cell data, IDs, serial numbers.             |
| `text-data-sm`    | 12px | 16px (1.33) | 400 reg  | Plex Mono | Compact table cells, log entries.                 |
| `text-data-lg`    | 18px | 24px (1.33) | 500 med  | Plex Mono | Dashboard KPI values, pressure readouts.          |
| `text-code`       | 13px | 18px (1.38) | 400 reg  | Plex Mono | Inline codes, device IDs.                         |

### 4.4 Typography Rules

1. **Maximum 3 sizes per screen.** Most pages will use: page title (20px), section header (16px), and body/data (14px). Adding a fourth size should require justification.

2. **Monospace for all numbers.** Pressure values, quantities, prices, dates, IDs, serial numbers -- anything numeric uses IBM Plex Mono. This creates aligned columns naturally and signals "this is data" to the operator.

3. **No thin weights.** The minimum weight is 400 (regular). The interface must be readable in low-light warehouse conditions and on lower-quality monitors. Weights 100-300 are prohibited.

4. **No text larger than 20px.** There is no `text-3xl`, `text-4xl`, or hero text in the system. If you need visual hierarchy, use weight and color, not size. The exception is marketing/landing pages outside the application.

5. **Uppercase only for overlines.** Category labels, status badges, and section grouping labels may use `text-overline` (11px, semibold, 0.05em tracking, uppercase). No other text should be fully capitalized.

6. **Line lengths.** Body text should not exceed 72ch (approximately 504px at 14px). Table descriptions and form helper text should wrap before 60ch.

### 4.5 Responsive Typography

The type scale does not change across breakpoints within the application. The application targets 1080p desktop as the primary viewport and 1366px+ as the common case. There is no mobile-first responsive scaling.

However, for the authentication/login flow (which may be accessed on tablets):

| Breakpoint | Page title | Body |
| ---------- | ---------- | ---- |
| >= 1024px  | 20px       | 14px |
| 768-1023px | 18px       | 14px |
| < 768px    | 16px       | 14px |

Body text never drops below 14px. Below 768px, the application shows a "desktop recommended" notice rather than attempting a full responsive layout.

---

## 5. Spacing, Radius, and Density

### 5.1 Spacing Scale

The spacing scale is deliberately tight. GasTrack is a data-dense interface where vertical space directly translates to visible rows and visible data.

| Token    | Value    | px  | Usage                                     |
| -------- | -------- | --- | ----------------------------------------- |
| `sp-0.5` | 0.125rem | 2   | Inline icon-to-text gap                   |
| `sp-1`   | 0.25rem  | 4   | Tight padding (badge, small tag)          |
| `sp-1.5` | 0.375rem | 6   | Table cell vertical padding               |
| `sp-2`   | 0.5rem   | 8   | Default gap between related elements      |
| `sp-3`   | 0.75rem  | 12  | Card inner padding, input padding         |
| `sp-4`   | 1rem     | 16  | Section gap, card padding on larger cards |
| `sp-5`   | 1.25rem  | 20  | Gap between sections                      |
| `sp-6`   | 1.5rem   | 24  | Page margin, major section separation     |
| `sp-8`   | 2rem     | 32  | Layout-level gaps, sidebar padding        |

**Key density principles:**

- Table row height: 36px (allows ~28 rows visible on 1080p with header and pagination)
- Compact table row: 32px (allows ~32 rows, used in log views)
- Card padding: 12px (sp-3)
- Section gap: 16px (sp-4)
- Page side margin: 24px (sp-6)
- No gap exceeds 32px within the application layout. Whitespace is not used for "breathing room." Space is used for grouping and separation.

### 5.2 Border Radius

Border radius follows a strict functional hierarchy. The rule: containers are square, interactive elements are slightly rounded.

| Element Type         | Radius        | Value    | Rationale                                                        |
| -------------------- | ------------- | -------- | ---------------------------------------------------------------- |
| Page containers      | 0px           | 0        | Industrial. Hard edges. No softening.                            |
| Cards / panels       | 2px           | 0.125rem | Barely perceptible. Prevents "cut paper" look without softening. |
| Buttons              | 4px           | 0.25rem  | Just enough to read as clickable.                                |
| Inputs / selects     | 4px           | 0.25rem  | Matches buttons for visual consistency.                          |
| Dropdowns / popovers | 4px           | 0.25rem  | Matches inputs they emerge from.                                 |
| Badges / tags        | 4px           | 0.25rem  | Consistent with other small interactive.                         |
| Avatars / thumbnails | 9999px (full) | --       | Circular. The only fully rounded element.                        |
| Tooltips             | 2px           | 0.125rem | Minimal. Information containers.                                 |
| Progress bars        | 2px           | 0.125rem | Subtle rounding on track and fill.                               |

**What this replaces:** The current system uses `rounded-xl` (12px) on cards and `rounded-full` on badges. This is the consumer SaaS aesthetic the brief rejects. The new system is aggressively flat.

**Tailwind CSS 4 configuration:**

```css
@theme {
  --radius-sm: 0.125rem; /* 2px - cards, tooltips, progress */
  --radius-md: 0.25rem; /* 4px - buttons, inputs, badges */
  --radius-lg: 0.25rem; /* 4px - same as md, no escalation */
  --radius-xl: 0.25rem; /* 4px - override to prevent consumer aesthetics */
  --radius-2xl: 0.25rem; /* 4px - override */
  --radius-full: 9999px; /* Only for avatars */
}
```

### 5.3 Component Sizing

| Component         | Height | Padding (h) | Padding (v) | Font            |
| ----------------- | ------ | ----------- | ----------- | --------------- |
| Button - sm       | 28px   | 10px        | 4px         | 13px / 500      |
| Button - md       | 32px   | 12px        | 6px         | 13px / 500      |
| Button - lg       | 36px   | 16px        | 8px         | 14px / 500      |
| Input - sm        | 28px   | 8px         | 4px         | 13px / 400      |
| Input - md        | 32px   | 10px        | 6px         | 14px / 400      |
| Input - lg        | 36px   | 12px        | 8px         | 14px / 400      |
| Table row         | 36px   | 12px        | 6px         | 14px / 400 mono |
| Table row compact | 32px   | 8px         | 4px         | 12px / 400 mono |
| Table header      | 32px   | 12px        | 6px         | 13px / 600      |
| Nav item          | 32px   | 12px        | 6px         | 13px / 500      |
| Badge             | 22px   | 8px         | 2px         | 11px / 500      |
| Tab               | 36px   | 16px        | 8px         | 13px / 500      |

### 5.4 Density Contexts

Different areas of the application warrant different density levels:

**High density (dashboard, tables, logs):**

- Row height: 32-36px
- Card padding: 12px
- Gap between cards: 8px
- Goal: Maximum data visibility

**Medium density (forms, detail views):**

- Input height: 32px
- Label-to-input gap: 4px
- Field-to-field gap: 12px
- Section-to-section gap: 20px
- Goal: Comfortable data entry without wasted space

**Low density (auth, onboarding, empty states):**

- More generous vertical spacing (24-32px between elements)
- Centered content with max-width 400px
- Goal: Focused attention, reduced cognitive load

---

## 6. Iconography

### 6.1 System Icon Style

| Property      | Value                                     | Rationale                                                              |
| ------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Stroke weight | 1.5px                                     | Matches IBM Plex Sans stem width at 14px                               |
| Line cap      | Square (butt)                             | Industrial. Round caps read as friendly/soft.                          |
| Line join     | Miter (sharp corners)                     | Consistent with square linecaps.                                       |
| Corner radius | 0px on icon geometry                      | Hard edges. Icons match container philosophy.                          |
| Grid          | 20x20px (with 2px padding = 16px visible) | Aligns to 4px grid. Standard touch target when wrapped in 32px button. |
| Optical size  | 16px, 20px, 24px                          | Three sizes only. No arbitrary scaling.                                |
| Fill          | Never filled by default                   | Outlined icons are lighter, more technical.                            |
| Color         | Inherits `currentColor`                   | Icons follow text color, never independently colored (except status).  |

### 6.2 Recommended Base Library

**Lucide Icons** (lucide.dev) as the system icon foundation. Lucide provides:

- Consistent 24x24 grid with 2px stroke (adjustable to 1.5px)
- Square linecaps available
- MIT licensed
- Angular package available (`lucide-angular`)
- 1400+ icons covering common UI needs

Configure globally with `strokeWidth: 1.5` and `strokeLinecap: "butt"` to match the GasTrack style.

### 6.3 Domain-Specific Icons (Custom)

These icons do not exist in standard libraries and must be created as custom SVGs. Each follows the same 20x20 grid, 1.5px stroke rules.

| Icon             | Description                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cylinder`       | Vertical rectangle with rounded top shoulder, flat base. Small valve protrusion at top center. Side profile, single stroke.                      |
| `cylinder-group` | Three overlapping cylinder silhouettes, offset horizontally. Represents inventory/batch.                                                         |
| `pressure-gauge` | Circle with centered pivot dot and angled needle line. Two tick marks at 9 and 12 o'clock. Matches logo direction 1 geometry.                    |
| `valve`          | T-shaped form: horizontal handwheel bar on top of a vertical stem widening to a trapezoidal body. Represents valve open/close states.            |
| `pipe-connector` | Two parallel horizontal lines connected by a short vertical section with flange marks (small perpendicular ticks). Represents pipeline/manifold. |
| `regulator`      | Horizontal capsule shape with input connector on left, output on right, and a small circular gauge on top. Side profile.                         |
| `delivery-truck` | Simplified truck profile (cab + flatbed) with a small cylinder shape on the bed. Represents delivery/logistics.                                  |
| `psi-reading`    | The letters "PSI" in a monospace style within a rounded-rectangle frame. Used as a compact unit indicator.                                       |

### 6.4 Icon Usage Rules

1. **Icons never appear without adjacent text** in navigation and buttons. The only exception is toolbar actions in tight table headers where a tooltip provides the label.
2. **Icon color matches text color.** An icon next to a label inherits the label's color. Never color an icon independently unless it represents a status.
3. **Status icons may carry status color.** A warning icon next to a pressure reading may be colored warning-400 (dark) or warning-600 (light). This is the only case where icons have independent color.
4. **No animated icons.** Icons are static. Loading states use a simple spinner (rotating circle with a gap), not animated icon transformations.
5. **Icon + text spacing: 6px** (sp-1.5). Consistent everywhere.

---

## 7. Surface and Elevation

### 7.1 Surface Differentiation

GasTrack differentiates surfaces by lightness, not shadows. This follows the SCADA/control-room principle where flat surfaces reduce visual noise during extended viewing.

**Dark mode surface stack (primary context):**

```
Layer 0 - Page background:     oklch(0.163 0.016 261.49)  slate-900
Layer 1 - Card / panel:        oklch(0.216 0.02 258.34)   slate-800
Layer 2 - Popover / dropdown:  oklch(0.250 0.023 259.33)  slate-700
Layer 3 - Tooltip / overlay:   oklch(0.283 0.027 260.02)  slate-600
```

Each layer is roughly 0.04 lightness apart in OKLCH. This is enough to read as distinct surfaces without creating harsh boundaries.

**Light mode surface stack:**

```
Layer 0 - Page background:     oklch(0.945 0.008 260)     Custom (between slate-50 and 100)
Layer 1 - Card / panel:        oklch(0.99 0.003 260)      Near-white
Layer 2 - Popover / dropdown:  oklch(0.99 0.003 260)      Same as card (distinguished by border + position)
Layer 3 - Tooltip / overlay:   oklch(0.326 0.03 258.34)   slate-500 (inverted: dark tooltip on light bg)
```

In light mode, Layer 1 and 2 share the same background. Popovers and dropdowns are distinguished by their border and spatial relationship (floating above content) rather than background color. This reduces the number of distinct grays, which keeps the light theme cleaner.

### 7.2 Border Treatment

Borders do real work in this system. They separate, they group, they indicate state.

| Border Type        | Color (Dark)                      | Color (Light)                     | Width | Usage                                           |
| ------------------ | --------------------------------- | --------------------------------- | ----- | ----------------------------------------------- |
| Container border   | oklch(0.283 0.027 260.02) sla-600 | oklch(0.862 0.025 263.33) sla-100 | 1px   | Cards, panels, modals                           |
| Divider            | oklch(0.250 0.023 259.33) sla-700 | oklch(0.862 0.025 263.33) sla-100 | 1px   | Between table rows, sections                    |
| Input border       | oklch(0.283 0.027 260.02) sla-600 | oklch(0.862 0.025 263.33) sla-100 | 1px   | Default input state                             |
| Input focus border | oklch(0.679 0.077 242.55) ste-400 | oklch(0.596 0.068 243.53) ste-500 | 1px   | Focused input                                   |
| Input error border | oklch(0.667 0.182 31.07) cri-400  | oklch(0.575 0.167 32.09) cri-500  | 1px   | Validation error                                |
| Active indicator   | oklch(0.679 0.077 242.55) ste-400 | oklch(0.596 0.068 243.53) ste-500 | 2px   | Active nav item left bar, active tab bottom bar |

**Border rules:**

1. All borders are 1px except active indicators (2px).
2. No double borders. If a card sits on a background, the card has a border. The background does not.
3. Table row dividers use the lighter divider color, not the container border color.
4. Nested borders: If a card contains a table, the table rows use dividers but the table itself has no border (the card border contains it).

### 7.3 Shadows

Shadows are used extremely sparingly. The only elements that cast shadows are:

1. **Dropdowns and popovers** (floating elements that overlap content):

   ```css
   box-shadow: 0 4px 12px oklch(0 0 0 / 0.15); /* dark mode */
   box-shadow: 0 4px 12px oklch(0 0 0 / 0.08); /* light mode */
   ```

2. **Modals:**

   ```css
   box-shadow: 0 8px 24px oklch(0 0 0 / 0.25); /* dark mode */
   box-shadow: 0 8px 24px oklch(0 0 0 / 0.12); /* light mode */
   ```

3. **Nothing else.** Cards do not have shadows. Buttons do not have shadows. The sidebar does not have a shadow. Elevation is communicated through lightness and borders.

---

## 8. Motion and Interaction

### 8.1 Timing

| Token                | Duration | Easing      | Usage                              |
| -------------------- | -------- | ----------- | ---------------------------------- |
| `--duration-instant` | 100ms    | ease-out    | Opacity changes, color transitions |
| `--duration-fast`    | 150ms    | ease-out    | Button hover/press, input focus    |
| `--duration-normal`  | 200ms    | ease-in-out | Dropdown open, panel expand        |
| `--duration-slow`    | 300ms    | ease-in-out | Modal enter, sidebar collapse      |

### 8.2 What Animates

**Animated (yes):**

- Color transitions on hover/focus (buttons, links, nav items): 150ms
- Dropdown/popover open and close: 200ms opacity + subtle translateY(4px to 0)
- Modal enter: 300ms opacity + scale(0.98 to 1)
- Modal backdrop: 300ms opacity
- Sidebar expand/collapse: 300ms width
- Toast/notification enter: 200ms translateX(100% to 0) from right edge
- Skeleton loading pulse: 1.5s infinite ease-in-out opacity between 0.4 and 1.0

**Never animated:**

- Page transitions (instant content swap, no fade/slide between routes)
- Table row appearance (data loads and appears, no staggered animation)
- Dashboard cards (no entrance animation, no counting number animations)
- Chart data (appears immediately when data resolves, no draw-in animation)
- Icon changes (swap instantly, no morph or rotation)

**The principle:** Animation exists only to communicate spatial relationships (where did this dropdown come from?) and state changes (this button is now active). Animation never exists for delight, entrance effects, or polish. Operators see these screens for 8 hours. Every animation plays thousands of times. It must be invisible through repetition.

### 8.3 Feedback Patterns

| Action              | Feedback                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Button click        | Background color darkens 1 stop (150ms). No scale change.                                                                    |
| Button hover        | Background color lightens 1 stop (150ms). Cursor: pointer.                                                                   |
| Link hover          | Underline appears (no color change). Cursor: pointer.                                                                        |
| Input focus         | Border color transitions to steel (150ms). 2px ring appears.                                                                 |
| Input error         | Border color transitions to critical (150ms). Error text appears below.                                                      |
| Destructive action  | Confirmation dialog with explicit consequences stated.                                                                       |
| Form submit success | Toast notification from right edge. Auto-dismiss in 4 seconds.                                                               |
| Form submit error   | Inline error messages on fields + toast with summary.                                                                        |
| Data loading        | Skeleton placeholder matching content layout. No spinner except in buttons.                                                  |
| Empty state         | Static illustration-free message with single action link.                                                                    |
| Long operation      | Button shows inline spinner (16px). Button text changes to "Salvando..." or equivalent. Button is disabled during operation. |

### 8.4 Loading States

**Skeleton loading** is the primary loading pattern. When data has not yet resolved:

- Table: Show 8 skeleton rows matching column widths. Each row pulses.
- Cards: Show card outlines with pulsing rectangular blocks inside.
- KPI values: Show a pulsing block matching the monospace number width.

**Spinner** is used only within buttons during form submission. A simple 16px circle with a 270-degree arc stroke, rotating. Stroke color matches button foreground.

**No full-page spinners.** No centered "loading..." text. No progress bars for indeterminate loads.

---

## 9. Brand Applications

### 9.1 Login Screen

The login screen is the first impression. It should feel like entering a control room, not a consumer app.

**Layout:**

- Two-column split. Left: 60% width, dark background (slate-950). Right: 40% width, the login form on a slightly lighter surface (slate-900).
- Left panel: Large GasTrack logo lockup, centered vertically. Below it, a single tagline in text-body weight: "Controle visivel para distribuicao de gas." Below that, a subtle data visualization -- a static pressure readout graph or a simplified dashboard wireframe rendered in the chart series colors at very low opacity. This is decorative but domain-specific (not generic geometric art).
- Right panel: Login form. "Entrar" as the page title (20px, semibold). Email and password inputs in medium density. Single primary button, full-width. "Esqueceu a senha?" as a text link below. No social login. No "create account" (this is B2B -- accounts are provisioned).
- No rounded corners on the panels. The split is a hard vertical line.

**Colors:**

- Left panel background: oklch(0.128 0.013 263.62) (slate-950)
- Right panel background: oklch(0.163 0.016 261.49) (slate-900)
- Logo: oklch(0.862 0.025 263.33) (slate-100)
- Input borders: oklch(0.283 0.027 260.02) (slate-600)
- Primary button: oklch(0.679 0.077 242.55) (steel-400) background, slate-900 text

### 9.2 Dashboard Layout

**Structure:** Horizontal bands, not a widget grid. Reading order is top-to-bottom, left-to-right.

```
+------------------------------------------------------------------+
| HEADER BAR (48px) - Logo | Page title | Search | User menu       |
+------------------------------------------------------------------+
| SIDEBAR (220px)          | CONTENT AREA                          |
| - Navigation             |                                       |
|   grouped by domain      | ALERT BAR (if any active alarms)      |
|   (Cilindros, Clientes,  | 32px tall, full width, critical-900   |
|    Contratos, Entregas,   | bg. Dismissable. Counts only.         |
|    Relatorios, Admin)     |                                       |
|                          | KPI ROW                               |
|                          | 4 values in a horizontal band:        |
|                          | [Cilindros ativos] [Alertas] [...]    |
|                          | Each: label (caption) + value (mono)  |
|                          |                                       |
|                          | SECTION: Cilindros com baixa pressao  |
|                          | Compact table, sorted by pressure ASC |
|                          | Columns: ID | Ponto | PSI | Ultima    |
|                          | leitura | Status badge                  |
|                          |                                       |
|                          | SECTION: Entregas pendentes           |
|                          | Compact table or list                 |
|                          |                                       |
|                          | SECTION: Consumo por regiao (chart)   |
|                          | Bar or line chart, desaturated series |
+------------------------------------------------------------------+
```

**Key principles:**

- No card grids. Sections flow vertically in a single column within the content area.
- Each section has a semibold 16px header with a subtle bottom border.
- KPI values use `text-data-lg` (18px monospace, medium weight).
- The alert bar appears only when there are active critical/warning conditions. It states: "3 cilindros em estado critico" as a link. It does not flash, pulse, or animate.
- Sidebar navigation uses 13px text, 32px row height, grouped by domain with overline labels.
- Active nav item: 2px steel-400 left border + steel-900 background (dark mode).

### 9.3 Data Table Styling

Tables are the core of the application. They must support scanning 30+ rows quickly.

**Header row:**

- Background: oklch(0.216 0.02 258.34) (slate-800 dark) / oklch(0.931 0.013 266.73) (slate-50 light)
- Text: 13px IBM Plex Sans, semibold (600), uppercase not applied (use sentence case)
- Height: 32px
- Bottom border: 1px, slightly more prominent than row dividers
- Sticky: `position: sticky; top: 0;` with z-index to overlay scrolled rows

**Data rows:**

- Background: transparent (inherit from surface)
- Text: 14px IBM Plex Mono for data columns, IBM Plex Sans for text columns
- Height: 36px (standard) or 32px (compact)
- Divider: 1px bottom border using divider color
- Hover: row background shifts to oklch(0.250 0.023 259.33) (slate-700 dark) / oklch(0.956 0.012 255.51) (steel-50 light)
- Selected: row background shifts to oklch(0.232 0.027 242.36) (steel-900 dark) / oklch(0.922 0.023 248.06) (steel-100 light)

**Status badges in tables:**

- Inline badge at the end of relevant rows (or in a dedicated "Status" column)
- Badge: 22px height, 4px radius, 8px horizontal padding
- Badge uses tank status colors (background + text)
- Text: 11px, medium weight (500)

**Pagination:**

- Fixed at table footer, not page footer
- Shows: "1-50 de 342" (monospace numbers) + page navigation
- Always visible, even during loading

**Sortable columns:**

- Header shows a subtle chevron icon (12px) next to sortable column names
- Active sort: chevron fills with foreground color
- Click toggles ASC/DESC
- No multi-column sort (keep it simple)

### 9.4 Chart Styling

**Line charts (pressure over time):**

- Background: transparent (sits on card surface)
- Grid lines: 1px, border color, horizontal only (no vertical grid)
- Axis labels: 12px IBM Plex Mono, slate-300 color
- Line width: 2px
- Data points: 4px circles, only shown on hover
- Series colors: From chart palette (Section 3.7), Series 1 = steel
- Tooltip: popover-styled (dark tooltip with slate-700 bg), shows exact value + timestamp in monospace
- No area fill under lines. Pure line charts. Area fill adds visual weight without information.

**Bar charts:**

- Same axis treatment as line charts
- Bar width: 60% of available space per category
- Bar radius: 2px top corners only
- Grouped bars use adjacent series colors at full opacity
- No stacked bars (they hide individual values)

**Chart title:** 14px semibold IBM Plex Sans, positioned above the chart area, left-aligned.

### 9.5 Empty States

When a table, list, or section has no data:

**Layout:**

- Centered within the content area
- No illustration. No cartoon. No emoji.
- A domain-specific icon (from custom set) at 48px, rendered in slate-400 (dark) / slate-300 (light)
- Below the icon: the state description in `text-body` (14px, regular): "Nenhum cilindro cadastrado."
- Below the description: a single text link or ghost button with the primary action: "Cadastrar cilindro"
- Total vertical space occupied: approximately 160px

**What empty states never do:**

- Celebrate the emptiness ("Tudo limpo por aqui!")
- Use consumer illustrations (people, plants, abstract shapes)
- Show multiple actions (one action only)
- Fill the entire viewport (the sidebar and header remain, grounding the context)

### 9.6 Error States

**Inline field errors:**

- Text appears immediately below the input, left-aligned
- Color: critical-400 (dark) / critical-600 (light)
- Font: 12px IBM Plex Sans, regular
- Appears on blur or on submit attempt
- Input border changes to critical color simultaneously

**Toast notifications (errors):**

- Position: top-right, below header bar
- Background: critical-900 (dark) / critical-50 (light)
- Border-left: 3px critical-400 (dark) / critical-500 (light)
- Text: 13px, critical foreground color
- Icon: 16px alert-circle icon in critical color
- Duration: persistent (errors do not auto-dismiss). User must click X.
- Maximum visible toasts: 3. Additional queue behind.

**Full-page errors (500, network failure):**

- Centered content, same treatment as empty states
- Icon: 48px alert-triangle in critical color
- Title: "Erro de conexao" or "Erro interno" in `text-section` (16px semibold)
- Description: specific cause if available, otherwise "Nao foi possivel carregar os dados. Verifique sua conexao e tente novamente."
- Action button: "Tentar novamente" (primary button)
- Show last-sync timestamp if available: "Ultima sincronizacao: 14:32"

### 9.7 Notification / Toast Treatment

**Structure:**

```
+------------------------------------------------------+
| [icon 16px]  Title text (13px, semibold)       [X]   |
|              Description (12px, regular)              |
+------------------------------------------------------+
```

**Dimensions:**

- Width: 360px fixed
- Padding: 12px
- Border radius: 4px
- Border-left: 3px colored by status

**Variants by status:**
| Variant | Left border | Background (Dark) | Background (Light) |
|-------------|--------------------------|----------------------------|---------------------------|
| Success | success-400 | success-900 | success-50 |
| Warning | warning-400 | warning-900 | warning-50 |
| Error | critical-400 | critical-900 | critical-50 |
| Info | info-400 | info-900 | info-50 |

**Behavior:**

- Enter: 200ms slide from right + fade in
- Success/Info: auto-dismiss after 4 seconds
- Warning: auto-dismiss after 6 seconds
- Error: persistent until dismissed
- Exit: 200ms fade out
- Stack: new toasts push older ones down by 8px (sp-2) gap

---

## 10. Brand Book Structure

A 20-page brand book for internal use and vendor communication.

| Page | Section                   | Content Description                                                                                                      |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1    | Cover                     | GasTrack logo centered on slate-950 background. Version and date.                                                        |
| 2    | Brand Story               | The narrative from Section 1.1. Why GasTrack exists. Full page of text.                                                  |
| 3    | Brand Archetype & Voice   | The Sage archetype explanation. Voice matrix table. Do's and don'ts with real UI copy examples.                          |
| 4    | Messaging Hierarchy       | Primary tagline, supporting messages, proof points. Hierarchy visualized as a pyramid.                                   |
| 5    | Logo: Primary Mark        | The recommended logo direction fully specified. Construction grid, proportions, minimum sizes.                           |
| 6    | Logo: Variations          | All logo variations: full lockup, stacked, icon only, monochrome, reversed. Clear space rules.                           |
| 7    | Logo: Misuse              | Common mistakes to avoid. Stretching, recoloring, adding effects, rotating, crowding. 8 examples of what not to do.      |
| 8    | Color: Philosophy         | ISA-101 principles. Why gray is default. Why color is reserved for status. The single-accent approach.                   |
| 9    | Color: Neutral Palette    | Full 11-stop slate palette with swatches, OKLCH values, and role assignments.                                            |
| 10   | Color: Brand Accent       | Full 11-stop steel palette with usage guidelines. Where the accent appears and where it does not.                        |
| 11   | Color: Status System      | All four status palettes (critical, warning, success, info) with ISA-101 mapping and tank status assignments.            |
| 12   | Color: Semantic Tokens    | Complete token table for light and dark modes. The bridge between palettes and implementation.                           |
| 13   | Typography: Typefaces     | IBM Plex Sans and IBM Plex Mono specimens. Weight range. Why these fonts were chosen.                                    |
| 14   | Typography: Scale & Rules | Complete type scale table. The "no text above 20px" rule. Monospace for numbers rule. Line length limits.                |
| 15   | Spacing & Density         | Spacing scale, border radius rules, component sizing table. Side-by-side comparison of high/medium/low density contexts. |
| 16   | Iconography               | Icon style rules. Grid and stroke specifications. Domain icon inventory with construction details.                       |
| 17   | Surface & Elevation       | Surface stack diagrams for light and dark modes. Border treatment rules. Shadow usage (or non-usage).                    |
| 18   | Motion & Interaction      | Timing tokens. What animates vs. what does not. Feedback pattern inventory. Loading state specifications.                |
| 19   | Applications: Key Screens | Annotated wireframes of login, dashboard, data table, and chart views showing brand elements in context.                 |
| 20   | Applications: Components  | Component specimens: buttons, inputs, badges, toasts, empty states, error states. All variants, all states.              |

---

## Appendix A: Migration Notes from Current System

The current `styles.css` uses a teal (hue 175) primary with high chroma (0.14-0.15). The new system shifts to steel blue (hue ~243) with lower chroma (0.068-0.077). Key changes:

| Token                 | Current Value             | New Value                       | Change Reason                        |
| --------------------- | ------------------------- | ------------------------------- | ------------------------------------ |
| `--primary`           | oklch(0.45 0.14 175) teal | oklch(0.596 0.068 243.53) steel | Desaturated, cooler, more industrial |
| `--font-sans`         | Inter                     | IBM Plex Sans                   | Industrial heritage, differentiation |
| `--radius-lg`         | 0.5rem (8px)              | 0.25rem (4px)                   | Flatter, more industrial             |
| `--radius-xl`         | 0.75rem (12px)            | 0.25rem (4px)                   | Eliminating consumer aesthetic       |
| `--radius-2xl`        | 1rem (16px)               | 0.25rem (4px)                   | Eliminating consumer aesthetic       |
| Card `.rounded-xl`    | 12px radius               | 2px radius                      | Hard edges for containers            |
| Badge `.rounded-full` | 9999px                    | 4px                             | Only avatars are fully rounded       |
| Dark bg               | oklch(0.13 0.015 260)     | oklch(0.163 0.016 261.49)       | Slightly lighter for comfort         |
| Card shadow           | shadow-sm                 | none                            | Flat surfaces, borders only          |

## Appendix B: Tailwind CSS 4 Implementation Checklist

1. Replace `--font-sans` with IBM Plex Sans stack
2. Add `--font-mono` with IBM Plex Mono stack
3. Replace primary color scale (hue 175 to hue 243)
4. Add neutral slate scale from palettes.json
5. Add status color scales from palettes.json
6. Update all radius tokens
7. Remove shadow from card component class
8. Update `.card` class to use `rounded-sm` (2px) instead of `rounded-xl`
9. Update `.badge` class to use `rounded-md` (4px) instead of `rounded-full`
10. Update dark mode background values
11. Add chart series CSS custom properties
12. Add type scale custom properties or utility classes
13. Verify all contrast ratios in browser after implementation

## Appendix C: Color Hex Reference

For use with external tools, print materials, and Pantone matching.

| Color        | Hex     | Pantone (nearest) | CMYK (approx)  |
| ------------ | ------- | ----------------- | -------------- |
| Steel 500    | #5B84A5 | 7461 C            | 60, 30, 10, 5  |
| Steel 400    | #6D96B8 | 7460 C            | 50, 22, 8, 2   |
| Slate 900    | #161B24 | Black 6 C         | 80, 65, 45, 75 |
| Slate 500    | #343C4A | 7546 C            | 70, 55, 40, 40 |
| Slate 100    | #D1D6DE | Cool Gray 2 C     | 12, 8, 5, 0    |
| Critical 500 | #B34A2B | 7599 C            | 15, 75, 85, 5  |
| Warning 500  | #AD8520 | 7555 C            | 15, 30, 90, 5  |
| Success 500  | #3A9A68 | 7731 C            | 70, 10, 55, 5  |
| Info 500     | #4A7AAA | 7462 C            | 60, 30, 10, 5  |

---

_This document is the source of truth for GasTrack's visual identity. Every design and implementation decision should reference these specifications. When in doubt, return to the ISA-101 principle: gray is normal, color is signal._
