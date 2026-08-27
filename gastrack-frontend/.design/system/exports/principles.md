<!-- chunk:principles -->
<!-- version: 1.0 | system: GasTrack Design System -->

# Design Principles

## 1. Instrument, Don't Decorate

Every visual element must carry information. If removing an element loses no meaning, remove it. Shadows, gradients, and decorative borders are noise in a control-room interface. Differentiate surfaces by lightness, not effects.

## 2. Gray Is the Default; Color Is Signal

Following ISA-101 philosophy, the interface is predominantly gray. Color appears only to communicate status, actions, or errors. When everything is colorful, nothing stands out. When the interface is calm gray, a single red indicator is impossible to miss.

## 3. Density Serves the Operator

Operators scan dashboards, not read them. Compact layouts with 36px table rows, 12px card padding, and tight type scales reduce scrolling and keep related data visible together. Never sacrifice scannability for whitespace.

## 4. Predictable Over Clever

Every interaction must behave identically across the system. A button looks the same in a modal as in a toolbar. A form field behaves the same in a dialog as on a page. Zero surprises.

## 5. Accessible by Default

Minimum 4.5:1 contrast on text. Minimum 3:1 on interactive boundaries. Every interactive element keyboard-navigable. Every state visually distinct without relying on color alone.

---

## Do's and Don'ts

### Color

- DO: Use gray for most of the interface. Reserve color for status indicators.
- DON'T: Color-code navigation items, section headers, or decorative elements.
- DO: Use the exact status palette colors (critical, warning, success, info).
- DON'T: Invent new status colors or use red for non-error decoration.

### Typography

- DO: Use IBM Plex Mono for pressure values, serial numbers, and numeric data columns.
- DON'T: Use monospace for labels, titles, or body text.
- DO: Stay within the 11-24px type scale.
- DON'T: Use font sizes outside the scale (no 28px, no 10px).

### Spacing

- DO: Use the spacing scale tokens (sp-0.5 through sp-24).
- DON'T: Use arbitrary values like 5px, 7px, or 15px.
- DO: Use 12px card padding consistently.
- DON'T: Mix 16px and 24px card padding across the same view.

### Components

- DO: Use the Button component for all clickable actions.
- DON'T: Style `<a>` tags to look like buttons without proper button semantics.
- DO: Keep table rows at 36px for scannability.
- DON'T: Use relaxed (44px) rows in dense data views.
- DO: Use skeleton loading that matches the layout shape.
- DON'T: Use a single centered spinner for page-level loading.

### Elevation

- DO: Use shadows only on floating elements (dropdowns, modals, toasts).
- DON'T: Add shadows to cards, containers, or static page elements.
- DO: Differentiate surfaces by lightness (oklch L channel).
- DON'T: Stack shadows to create visual hierarchy.

### Radius

- DO: Use 2px for containers, 4px for interactive, 6px for floating.
- DON'T: Use 8px+ radius anywhere except badges (radius-full).

### Motion

- DO: Animate state transitions (hover, focus, open/close).
- DON'T: Add entrance animations, bouncing, or number-counting effects.
- DO: Respect prefers-reduced-motion.
- DON'T: Assume all users can see animations.

### Status Indication

- DO: Always pair color with icon AND text label for status.
- DON'T: Communicate status through color alone (fails color-blind users).

<!-- end:chunk -->
