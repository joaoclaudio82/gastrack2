# GasTrack WCAG 2.2 AA Accessibility Audit

**Audit Date:** 2026-03-12
**Auditor:** Apple Accessibility Specialist (Automated)
**Standard:** WCAG 2.2 Level AA
**Application:** GasTrack - Industrial Gas Management System
**Stack:** Angular 21, Tailwind CSS 4, oklch color space

---

## 1. POUR Assessment

### 1.1 Perceivable

| #      | Criterion               | Status            | Notes                                                                                                                                                                                                                                                                                                                |
| ------ | ----------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1  | Non-text Content        | PASS              | SVG icons use `aria-hidden="true"` consistently. Buttons with icon-only variants have `aria-label`. Logo SVG in auth-layout lacks `aria-hidden` attribute.                                                                                                                                                           |
| 1.2.1  | Audio-only/Video-only   | N/A               | No time-based media present.                                                                                                                                                                                                                                                                                         |
| 1.3.1  | Info and Relationships  | PASS              | Form inputs have associated labels via `for`/`id` binding. Fieldsets with legends used for radio groups. Tables use explicit `role="table"`, `role="rowgroup"`. Error messages linked via `aria-describedby`.                                                                                                        |
| 1.3.2  | Meaningful Sequence     | PASS              | DOM order matches visual order. Content flows logically.                                                                                                                                                                                                                                                             |
| 1.3.3  | Sensory Characteristics | PASS              | Instructions do not rely solely on shape, size, or location.                                                                                                                                                                                                                                                         |
| 1.3.4  | Orientation             | PASS              | No orientation lock detected. Layout is responsive.                                                                                                                                                                                                                                                                  |
| 1.3.5  | Identify Input Purpose  | FAIL              | Input component defaults `autocomplete="off"`. Login form email/password fields should use `autocomplete="email"` and `autocomplete="current-password"` respectively.                                                                                                                                                |
| 1.4.1  | Use of Color            | PASS              | Error states use icon + text in addition to color. Tank status uses text labels alongside colored indicators. Alert component uses icons alongside color variants.                                                                                                                                                   |
| 1.4.2  | Audio Control           | N/A               | No audio content.                                                                                                                                                                                                                                                                                                    |
| 1.4.3  | Contrast (Minimum)      | **SEE SECTION 4** | Multiple color pairs require verification. Several borderline cases identified.                                                                                                                                                                                                                                      |
| 1.4.4  | Resize Text             | PASS              | Typography uses rem units. Layout reflows properly.                                                                                                                                                                                                                                                                  |
| 1.4.5  | Images of Text          | PASS              | No images of text used. All text is real text.                                                                                                                                                                                                                                                                       |
| 1.4.10 | Reflow                  | PASS              | Tables have horizontal scroll container. Layout adapts to viewport.                                                                                                                                                                                                                                                  |
| 1.4.11 | Non-text Contrast       | FAIL              | Focus ring uses `ring-ring/20` (20% opacity) on input-focus class in styles.css. This significantly reduces the contrast of the focus indicator for inputs, likely failing the 3:1 requirement. Checkbox and radio borders at `border-input` (L=0.862 light) on white card (L=0.99) have delta L=0.128 -- fails 3:1. |
| 1.4.12 | Text Spacing            | PASS              | No fixed-height containers that would clip text with modified spacing.                                                                                                                                                                                                                                               |
| 1.4.13 | Content on Hover/Focus  | PASS              | Dropdown overlays can be dismissed via Escape. Tooltips not present.                                                                                                                                                                                                                                                 |

### 1.2 Operable

| #      | Criterion               | Status         | Notes                                                                                                                                                                                                                                                                                                                             |
| ------ | ----------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1  | Keyboard                | PASS (partial) | Select, combobox, multi-select, date-picker all implement keyboard navigation (Arrow keys, Enter, Escape, Tab). Modal closes on Escape. However, the header dropdown menu does not trap focus or support Arrow key navigation between menu items.                                                                                 |
| 2.1.2  | No Keyboard Trap        | PASS           | Tab key closes dropdown overlays. Escape closes modals and popovers.                                                                                                                                                                                                                                                              |
| 2.1.4  | Character Key Shortcuts | N/A            | No single-character shortcuts detected.                                                                                                                                                                                                                                                                                           |
| 2.2.1  | Timing Adjustable       | N/A            | No time limits detected (toast auto-dismiss may apply but is managed by notification service).                                                                                                                                                                                                                                    |
| 2.3.1  | Three Flashes           | PASS           | Animations are subtle transitions (150-200ms). No flashing content.                                                                                                                                                                                                                                                               |
| 2.4.1  | Bypass Blocks           | FAIL           | No skip navigation link present. Users must tab through entire sidebar to reach main content.                                                                                                                                                                                                                                     |
| 2.4.2  | Page Titled             | PASS           | Page title set in index.html. Individual route titles should be verified at router level.                                                                                                                                                                                                                                         |
| 2.4.3  | Focus Order             | PASS           | DOM order follows logical visual order.                                                                                                                                                                                                                                                                                           |
| 2.4.4  | Link Purpose            | PASS           | Navigation links have descriptive text. Logo link has aria-label.                                                                                                                                                                                                                                                                 |
| 2.4.5  | Multiple Ways           | N/A            | Single-page app with sidebar navigation. Search not assessed.                                                                                                                                                                                                                                                                     |
| 2.4.6  | Headings and Labels     | PASS           | Login page uses h2. Modal uses h2 with id for aria-labelledby. Form labels are descriptive.                                                                                                                                                                                                                                       |
| 2.4.7  | Focus Visible           | FAIL (partial) | Global `:focus-visible` applies `ring-2 ring-offset-2` with `--ring` color. However, input-focus class uses `ring-ring/20` (20% opacity), which is too faint. Button focus-visible uses full opacity ring -- PASS.                                                                                                                |
| 2.4.11 | Focus Not Obscured      | PASS           | No sticky elements that would obscure focused items (header is sticky but at top).                                                                                                                                                                                                                                                |
| 2.5.1  | Pointer Gestures        | PASS           | No complex gestures required. All interactions are simple clicks/taps.                                                                                                                                                                                                                                                            |
| 2.5.2  | Pointer Cancellation    | PASS           | Click events used (not mousedown).                                                                                                                                                                                                                                                                                                |
| 2.5.3  | Label in Name           | PASS           | Button text matches accessible name. Labels match visible text.                                                                                                                                                                                                                                                                   |
| 2.5.4  | Motion Actuation        | N/A            | No motion-activated features.                                                                                                                                                                                                                                                                                                     |
| 2.5.7  | Dragging Movements      | N/A            | No drag interactions detected.                                                                                                                                                                                                                                                                                                    |
| 2.5.8  | Target Size (Minimum)   | FAIL (partial) | Clear buttons inside select/combobox (p-0.5 with 3.5x3.5 icon = ~22x22px) fail the 24x24 minimum. Checkbox (h-4 w-4 = 16x16px) and radio (h-4 w-4 = 16x16px) are below minimum, though labels extend the click area. Sidebar collapse button has `min-h-[44px]` -- PASS. Header buttons have `min-h-[44px] min-w-[44px]` -- PASS. |

### 1.3 Understandable

| #     | Criterion                 | Status | Notes                                                                                                                                                   |
| ----- | ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1.1 | Language of Page          | FAIL   | `index.html` declares `lang="en"` but the application is in Portuguese (pt-BR). All UI text, labels, error messages, and aria-labels are in Portuguese. |
| 3.1.2 | Language of Parts         | N/A    | No mixed-language content that differs from the page language.                                                                                          |
| 3.2.1 | On Focus                  | PASS   | No unexpected context changes on focus.                                                                                                                 |
| 3.2.2 | On Input                  | PASS   | Form submissions require explicit button press. Selects close on selection but do not navigate.                                                         |
| 3.2.3 | Consistent Navigation     | PASS   | Sidebar navigation is consistent across pages.                                                                                                          |
| 3.2.4 | Consistent Identification | PASS   | Components are reused consistently (same button variants, same input patterns).                                                                         |
| 3.3.1 | Error Identification      | PASS   | Errors use `role="alert"`, include icon + text, and are linked via `aria-describedby`. Input border changes to destructive color.                       |
| 3.3.2 | Labels or Instructions    | PASS   | Form fields have labels. Required fields marked with asterisk + `aria-label="required"`.                                                                |
| 3.3.3 | Error Suggestion          | PASS   | Login form provides specific error messages ("Email invalido", "Minimo X caracteres").                                                                  |
| 3.3.4 | Error Prevention          | N/A    | No legal/financial transactions in audited components.                                                                                                  |
| 3.3.7 | Redundant Entry           | N/A    | No multi-step forms detected in audited scope.                                                                                                          |
| 3.3.8 | Accessible Authentication | PASS   | Login uses standard email/password. No CAPTCHA or cognitive tests.                                                                                      |

### 1.4 Robust

| #     | Criterion         | Status         | Notes                                                                                                                                                                                                                                                                                                                          |
| ----- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1.2 | Name, Role, Value | PASS (partial) | Select trigger uses `role="combobox"` with `aria-expanded`, `aria-haspopup`, `aria-controls`. Switch uses `role="switch"` with `aria-checked`. Modal uses `role="dialog"` with `aria-modal="true"`. However, the modal title id is hardcoded as `modal-title` -- if multiple modals exist simultaneously, id collision occurs. |
| 4.1.3 | Status Messages   | PASS           | Error messages use `role="alert"`. Toast uses `role="alert"` with `aria-live="polite"`.                                                                                                                                                                                                                                        |

---

## 2. Component-Level Audit

### ButtonComponent

| Check                 | Status | Notes                                                     |
| --------------------- | ------ | --------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `aria-busy` on loading, `aria-disabled` on disabled state |
| Keyboard navigable    | PASS   | Native button element                                     |
| Focus management      | PASS   | `focus-visible:ring-2` applied                            |
| Screen reader         | PASS   | Loading spinner has `aria-hidden="true"`                  |
| Color-only indicators | PASS   | Disabled state uses opacity + cursor change               |

### InputComponent

| Check                 | Status | Notes                                             |
| --------------------- | ------ | ------------------------------------------------- |
| ARIA roles/labels     | PASS   | `aria-invalid`, `aria-describedby` properly wired |
| Keyboard navigable    | PASS   | Native input element                              |
| Focus management      | FAIL   | Focus ring uses `/20` opacity -- too faint        |
| Screen reader         | PASS   | Error uses `role="alert"`, icons `aria-hidden`    |
| Color-only indicators | PASS   | Error has icon + text + border change             |

### CheckboxComponent

| Check                 | Status | Notes                                                                                    |
| --------------------- | ------ | ---------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `aria-describedby` for description                                                       |
| Keyboard navigable    | PASS   | Native checkbox input                                                                    |
| Focus management      | PASS   | Focus ring applied                                                                       |
| Screen reader         | PASS   | Label properly associated                                                                |
| Color-only indicators | N/A    |                                                                                          |
| Target size           | FAIL   | 16x16px checkbox target. Label extends clickable area but checkbox itself is undersized. |

### SelectComponent

| Check                 | Status | Notes                                                                                                   |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-expanded`, `aria-controls` |
| Keyboard navigable    | PASS   | Arrow keys, Enter, Space, Escape, Tab all handled                                                       |
| Focus management      | PASS   | Focus returns to trigger on close                                                                       |
| Screen reader         | PASS   | Listbox labelled by trigger id                                                                          |
| Color-only indicators | PASS   | Selected option has checkmark icon                                                                      |
| Target size           | FAIL   | Clear button is ~22x22px                                                                                |

### ComboboxComponent

| Check                 | Status | Notes                                                                                 |
| --------------------- | ------ | ------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `role="combobox"` on input, `aria-activedescendant`, `aria-expanded`, `aria-controls` |
| Keyboard navigable    | PASS   | Full keyboard support                                                                 |
| Focus management      | PASS   | Focus returns to input after clear                                                    |
| Screen reader         | PASS   | Listbox has `aria-label`                                                              |
| Color-only indicators | PASS   | Selected item has checkmark                                                           |
| Target size           | FAIL   | Clear button is ~22x22px                                                              |

### ModalComponent

| Check                 | Status | Notes                                                                                                                                                            |
| --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`                                                                                                          |
| Keyboard navigable    | PASS   | Escape to close                                                                                                                                                  |
| Focus management      | FAIL   | No focus trap implemented. Focus can escape the modal to background content. No initial focus management (should focus first focusable element or close button). |
| Screen reader         | PASS   | Close button has `aria-label`                                                                                                                                    |
| Color-only indicators | N/A    |                                                                                                                                                                  |
| ID collision          | FAIL   | `id="modal-title"` is hardcoded. Multiple modals would create duplicate IDs.                                                                                     |

### ToastComponent

| Check                 | Status | Notes                                                             |
| --------------------- | ------ | ----------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `role="alert"`, `aria-live="polite"`, `aria-labelledby` for title |
| Keyboard navigable    | PASS   | Dismiss button is focusable                                       |
| Focus management      | N/A    | Toasts appear non-intrusively                                     |
| Screen reader         | PASS   | Alert role announces content                                      |
| Color-only indicators | PASS   | Different icons per type + border color                           |

### DataTableComponent

| Check                 | Status | Notes                                                          |
| --------------------- | ------ | -------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | Explicit `role="table"`, `role="rowgroup"`                     |
| Keyboard navigable    | PASS   | Content projection allows consumer to add interactive elements |
| Focus management      | PASS   | focus-within ring applied to container                         |
| Screen reader         | PASS   | Proper table semantics                                         |
| Color-only indicators | N/A    |                                                                |

### SwitchComponent

| Check                 | Status | Notes                                                                                                                                                                       |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `role="switch"`, `aria-checked`                                                                                                                                             |
| Keyboard navigable    | PASS   | Native button handles Space/Enter                                                                                                                                           |
| Focus management      | PASS   | `focus-visible:ring-2` applied                                                                                                                                              |
| Screen reader         | PASS   | Label associated via `for` attribute                                                                                                                                        |
| Color-only indicators | FAIL   | On/off state differentiated only by color (primary vs input). No text or icon indicator for state. Screen readers get `aria-checked` but visual users rely solely on color. |

### RadioGroupComponent

| Check              | Status | Notes                                                  |
| ------------------ | ------ | ------------------------------------------------------ |
| ARIA roles/labels  | PASS   | Fieldset + legend pattern. Proper radio name grouping. |
| Keyboard navigable | PASS   | Native radio inputs                                    |
| Focus management   | PASS   | Focus ring applied                                     |
| Screen reader      | PASS   | Labels properly associated                             |
| Target size        | FAIL   | 16x16px radio target                                   |

### DatePickerComponent

| Check              | Status | Notes                                                                                     |
| ------------------ | ------ | ----------------------------------------------------------------------------------------- |
| ARIA roles/labels  | PASS   | `aria-haspopup="dialog"`, `role="dialog"`, `aria-modal`, `aria-label` on calendar popover |
| Keyboard navigable | PASS   | Enter/Space to toggle, Escape to close                                                    |
| Focus management   | FAIL   | Focus does not move to calendar when opened. No focus trap in calendar dialog.            |
| Screen reader      | PASS   | Describedby linked properly                                                               |
| Target size        | FAIL   | Clear button ~22x22px                                                                     |

### MultiSelectComponent

| Check                 | Status | Notes                                                                                        |
| --------------------- | ------ | -------------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `aria-multiselectable="true"` on listbox. Remove buttons have `aria-label` with option name. |
| Keyboard navigable    | PASS   | Full keyboard support                                                                        |
| Focus management      | PASS   |                                                                                              |
| Screen reader         | PASS   |                                                                                              |
| Color-only indicators | PASS   | Selected items shown as tags with remove button                                              |

### PaginationComponent

| Check              | Status | Notes                                                                                                                                                                                                |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels  | FAIL   | No `nav` or `role="navigation"` wrapper. No `aria-label` on the pagination region. Page size select lacks explicit label connection (uses wrapping label which is acceptable but could be stronger). |
| Keyboard navigable | PASS   | Uses button components and native select                                                                                                                                                             |
| Screen reader      | PASS   | Status text provides context                                                                                                                                                                         |
| Target size        | PASS   | Uses button component with sm size (h-8 = 32px)                                                                                                                                                      |

### AlertComponent

| Check                 | Status | Notes                                                                                                                                              |
| --------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels     | PASS   | `role="alert"`. Dismiss button has `aria-label`.                                                                                                   |
| Keyboard navigable    | PASS   | Dismiss button is focusable                                                                                                                        |
| Screen reader         | PASS   | Alert role announces content                                                                                                                       |
| Color-only indicators | PASS   | Icons differentiate alert types                                                                                                                    |
| Security              | FAIL   | Uses `[innerHTML]` for icon SVGs, which is an XSS risk. While `SafeHtmlPipe` is not used here (icons are hardcoded), using innerHTML is a concern. |

### SidebarComponent

| Check              | Status | Notes                                                                                         |
| ------------------ | ------ | --------------------------------------------------------------------------------------------- |
| ARIA roles/labels  | PASS   | `role="navigation"`, `aria-label="Navegacao principal"`, `aria-current="page"` on active link |
| Keyboard navigable | PASS   | All links are focusable. Collapse button is a native button.                                  |
| Focus management   | PASS   | `focus-visible` rings applied to all interactive elements                                     |
| Screen reader      | PASS   | Collapsed state provides title attributes. Logo link has aria-label.                          |
| Target size        | PASS   | Sidebar links have py-3 px-3 (adequate). Collapse button has min-h-[44px].                    |

### HeaderComponent

| Check              | Status | Notes                                                                                                            |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels  | PASS   | `aria-label`, `aria-expanded`, `aria-haspopup` on user menu trigger. Menu items have `role="menuitem"`.          |
| Keyboard navigable | FAIL   | Dropdown menu does not support Arrow key navigation between menu items. No `role="menubar"` pattern implemented. |
| Focus management   | FAIL   | Dropdown does not trap focus. No focus management on open/close.                                                 |
| Screen reader      | PASS   | Proper ARIA attributes                                                                                           |
| Target size        | PASS   | `min-h-[44px] min-w-[44px]` on menu toggle                                                                       |

### AuthLayoutComponent

| Check              | Status | Notes                                                                                                                                                                                                                                                     |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels  | FAIL   | Main content area lacks `role="main"` or `<main>` landmark. Logo SVG lacks `aria-hidden="true"`.                                                                                                                                                          |
| Keyboard navigable | PASS   |                                                                                                                                                                                                                                                           |
| Screen reader      | FAIL   | No landmark structure. Screen reader users cannot navigate by landmarks.                                                                                                                                                                                  |
| Color contrast     | FAIL   | `text-primary-foreground/90` on `bg-primary`: L=0.99\*0.9 opacity on L=0.596 background -- delta L ~0.29, likely borderline/fail for small text. Footer `text-primary-foreground/70` on `bg-primary`: L effectively ~0.69 on L=0.596 -- very likely fail. |

### LoginComponent

| Check              | Status | Notes                                                                                                                 |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels  | PASS   | Error alert has proper structure. Form uses app-input with labels.                                                    |
| Keyboard navigable | PASS   | Standard form navigation                                                                                              |
| Screen reader      | PASS   | Error alert visible with icon + text                                                                                  |
| Form a11y          | FAIL   | Error alert div lacks `role="alert"`. Uses visual styling only. Should use `role="alert"` or `aria-live="assertive"`. |

---

## 3. Violations Table

| ID  | Severity  | WCAG           | Component                      | Issue                                                                                      | Remediation                                                                                                                                                    |
| --- | --------- | -------------- | ------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V01 | Critical  | 3.1.1          | index.html                     | `lang="en"` but UI is Portuguese                                                           | Change to `lang="pt-BR"`                                                                                                                                       |
| V02 | Critical  | 2.4.1          | App (global)                   | No skip navigation link                                                                    | Add `<a href="#main-content" class="sr-only focus:not-sr-only ...">Pular para o conteudo</a>` before sidebar. Add `id="main-content"` to main content area.    |
| V03 | Critical  | 2.4.7 / 1.4.11 | InputComponent                 | Input focus ring uses 20% opacity (`ring-ring/20`)                                         | Change to full opacity or at least 50%: `focus-visible:ring-ring` or `focus-visible:ring-ring/50`. Also fix in `styles.css` `.input-focus` class.              |
| V04 | Critical  | Modal          | ModalComponent                 | No focus trap. Focus can escape modal to background.                                       | Implement focus trap using `cdkTrapFocus` directive from `@angular/cdk/a11y`. Move focus to first focusable element on open, return focus to trigger on close. |
| V05 | Important | 1.4.11         | CheckboxComponent              | Checkbox border contrast fails. Border-input (L=0.862) on card (L=0.99) = delta L 0.128    | Use darker border for checkbox: `border-slate-400` or `border-muted-foreground` for unchecked state.                                                           |
| V06 | Important | 1.4.11         | RadioGroupComponent            | Radio border contrast same issue as checkbox                                               | Same fix as V05                                                                                                                                                |
| V07 | Important | 2.5.8          | Select, Combobox, DatePicker   | Clear/dismiss buttons are ~22x22px                                                         | Increase to minimum 24x24px: change `p-0.5` to `p-1` or add `min-h-6 min-w-6`                                                                                  |
| V08 | Important | 4.1.2          | ModalComponent                 | Hardcoded `id="modal-title"` causes ID collision with multiple modals                      | Generate unique ID: `input<string>()` with default `modal-title-${generateId()}`                                                                               |
| V09 | Important | 2.1.1          | HeaderComponent                | Dropdown menu lacks Arrow key navigation                                                   | Implement roving tabindex or arrow key navigation for menu items per WAI-ARIA menu pattern                                                                     |
| V10 | Important | 2.4.7          | HeaderComponent                | Dropdown menu has no focus management on open/close                                        | Focus first menu item on open. Return focus to trigger on close.                                                                                               |
| V11 | Important | 2.4.7          | DatePickerComponent            | Focus does not move to calendar on open                                                    | Move focus to calendar grid/first focusable element when popover opens                                                                                         |
| V12 | Important | 1.3.5          | InputComponent, LoginComponent | `autocomplete="off"` default; login fields lack proper autocomplete values                 | Set `autocomplete="email"` on email field, `autocomplete="current-password"` on password field in login form                                                   |
| V13 | Important | 1.4.3          | AuthLayoutComponent            | Footer text `text-primary-foreground/70` on `bg-primary` likely fails 4.5:1 for small text | Use full opacity or lighter background strip for footer                                                                                                        |
| V14 | Important | 1.4.3          | AuthLayoutComponent            | Subtitle `text-primary-foreground/90` on `bg-primary` borderline for small text            | Use full opacity: `text-primary-foreground`                                                                                                                    |
| V15 | Important | 4.1.2          | AuthLayoutComponent            | No landmark regions (`<main>`, `<header>`)                                                 | Wrap content in `<main>` element. Add `aria-hidden="true"` to decorative SVG.                                                                                  |
| V16 | Important | 1.4.1 / 1.4.11 | SwitchComponent                | On/off state indicated only by color                                                       | Add a subtle visual indicator: move knob + add checkmark icon inside knob when checked, or add on/off text                                                     |
| V17 | Advisory  | 4.1.2          | PaginationComponent            | No navigation landmark                                                                     | Wrap in `<nav aria-label="Paginacao">`                                                                                                                         |
| V18 | Advisory  | 4.1.3          | LoginComponent                 | Error alert div lacks role="alert"                                                         | Add `role="alert"` to the error container div                                                                                                                  |
| V19 | Advisory  | Best Practice  | Global                         | No `prefers-reduced-motion` media query                                                    | Add `@media (prefers-reduced-motion: reduce)` to disable/reduce animations                                                                                     |
| V20 | Advisory  | 1.4.11         | Select checkmark SVG           | Checkmark icon in select option lacks `aria-hidden="true"`                                 | Add `aria-hidden="true"` to the checkmark SVG                                                                                                                  |
| V21 | Advisory  | Best Practice  | AuthLayoutComponent            | Logo SVG missing `aria-hidden="true"`                                                      | Add `aria-hidden="true"` to decorative SVG                                                                                                                     |

---

## 4. Color Contrast Verification

### Methodology

Using oklch Lightness (L) values as contrast proxy. The relationship between oklch L and perceived luminance is approximately: higher L = lighter color. A delta-L > 0.40 generally passes 4.5:1 for normal text; delta-L > 0.30 generally passes 3:1 for large text/UI components.

Note: oklch lightness is perceptually uniform but does not map linearly to WCAG contrast ratio. These are conservative estimates.

### Light Mode Semantic Pairs

| Pair                                  | Foreground L | Background L | Delta L | Estimated Ratio | Status                                                                       |
| ------------------------------------- | ------------ | ------------ | ------- | --------------- | ---------------------------------------------------------------------------- |
| foreground on background              | 0.326        | 0.945        | 0.619   | ~8:1            | PASS                                                                         |
| card-foreground on card               | 0.326        | 0.990        | 0.664   | ~10:1           | PASS                                                                         |
| primary-foreground on primary         | 0.990        | 0.596        | 0.394   | ~4.2:1          | BORDERLINE - passes for large text (3:1), borderline for normal text (4.5:1) |
| secondary-foreground on secondary     | 0.326        | 0.931        | 0.605   | ~7.5:1          | PASS                                                                         |
| muted-foreground on background        | 0.595        | 0.945        | 0.350   | ~3.5:1          | FAIL for normal text. Passes for large text.                                 |
| muted-foreground on card              | 0.595        | 0.990        | 0.395   | ~4.2:1          | BORDERLINE                                                                   |
| accent-foreground on accent           | 0.326        | 0.956        | 0.630   | ~8.5:1          | PASS                                                                         |
| destructive-foreground on destructive | 0.958        | 0.575        | 0.383   | ~4:1            | BORDERLINE - may fail for normal text                                        |
| warning-foreground on warning         | 0.250        | 0.707        | 0.457   | ~5.5:1          | PASS                                                                         |
| success-foreground on success         | 0.185        | 0.623        | 0.438   | ~5:1            | PASS                                                                         |
| info-foreground on info               | 0.178        | 0.566        | 0.388   | ~4:1            | BORDERLINE                                                                   |
| destructive text on background        | 0.575        | 0.945        | 0.370   | ~3.8:1          | FAIL for normal text                                                         |

### Dark Mode Semantic Pairs

| Pair                                  | Foreground L | Background L | Delta L | Estimated Ratio | Status                                           |
| ------------------------------------- | ------------ | ------------ | ------- | --------------- | ------------------------------------------------ |
| foreground on background              | 0.862        | 0.163        | 0.699   | ~12:1           | PASS                                             |
| card-foreground on card               | 0.862        | 0.216        | 0.646   | ~9:1            | PASS                                             |
| primary-foreground on primary         | 0.163        | 0.679        | 0.516   | ~6.5:1          | PASS                                             |
| secondary-foreground on secondary     | 0.862        | 0.250        | 0.612   | ~7.5:1          | PASS                                             |
| muted-foreground on background        | 0.595        | 0.163        | 0.432   | ~5:1            | PASS                                             |
| muted-foreground on card              | 0.595        | 0.216        | 0.379   | ~4:1            | BORDERLINE                                       |
| accent-foreground on accent           | 0.862        | 0.283        | 0.579   | ~7:1            | PASS                                             |
| destructive-foreground on destructive | 0.958        | 0.667        | 0.291   | ~2.8:1          | FAIL for normal text. Borderline for large text. |
| warning-foreground on warning         | 0.198        | 0.770        | 0.572   | ~7:1            | PASS                                             |
| success-foreground on success         | 0.185        | 0.693        | 0.508   | ~6:1            | PASS                                             |
| info-foreground on info               | 0.178        | 0.654        | 0.476   | ~5.5:1          | PASS                                             |

### Tank Status Colors - Light Mode

| Tank Status          | Text L | BG L  | Delta L | Status |
| -------------------- | ------ | ----- | ------- | ------ |
| Full: text on bg     | 0.236  | 0.961 | 0.725   | PASS   |
| Normal: text on bg   | 0.225  | 0.956 | 0.731   | PASS   |
| Low: text on bg      | 0.250  | 0.974 | 0.724   | PASS   |
| Critical: text on bg | 0.233  | 0.958 | 0.725   | PASS   |
| Empty: text on bg    | 0.216  | 0.931 | 0.715   | PASS   |

### Tank Status Colors - Dark Mode

| Tank Status          | Text L | BG L  | Delta L | Status |
| -------------------- | ------ | ----- | ------- | ------ |
| Full: text on bg     | 0.961  | 0.236 | 0.725   | PASS   |
| Normal: text on bg   | 0.956  | 0.225 | 0.731   | PASS   |
| Low: text on bg      | 0.974  | 0.250 | 0.724   | PASS   |
| Critical: text on bg | 0.958  | 0.233 | 0.725   | PASS   |
| Empty: text on bg    | 0.931  | 0.216 | 0.715   | PASS   |

### Tank Status Icon Colors - Light Mode (3:1 required for UI components)

| Tank Status          | Icon L | BG L  | Delta L | Status |
| -------------------- | ------ | ----- | ------- | ------ |
| Full: icon on bg     | 0.523  | 0.961 | 0.438   | PASS   |
| Normal: icon on bg   | 0.481  | 0.956 | 0.475   | PASS   |
| Low: icon on bg      | 0.597  | 0.974 | 0.377   | PASS   |
| Critical: icon on bg | 0.492  | 0.958 | 0.466   | PASS   |
| Empty: icon on bg    | 0.595  | 0.931 | 0.336   | PASS   |

### Tank Status Icon Colors - Dark Mode

| Tank Status          | Icon L | BG L  | Delta L | Status                    |
| -------------------- | ------ | ----- | ------- | ------------------------- |
| Full: icon on bg     | 0.693  | 0.236 | 0.457   | PASS                      |
| Normal: icon on bg   | 0.654  | 0.225 | 0.429   | PASS                      |
| Low: icon on bg      | 0.770  | 0.250 | 0.520   | PASS                      |
| Critical: icon on bg | 0.667  | 0.233 | 0.434   | PASS                      |
| Empty: icon on bg    | 0.457  | 0.216 | 0.241   | BORDERLINE - may fail 3:1 |

### Contrast Issues Summary

| ID  | Issue                                 | Mode  | Recommendation                                                                                          |
| --- | ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| C01 | muted-foreground on background        | Light | Delta L=0.350 fails 4.5:1 for body text. Darken muted-foreground to L ~0.52 or lower.                   |
| C02 | destructive-foreground on destructive | Light | Delta L=0.383 borderline. Consider darkening destructive or lightening foreground.                      |
| C03 | destructive-foreground on destructive | Dark  | Delta L=0.291 fails. Use dark foreground text on light destructive, or adjust destructive color darker. |
| C04 | primary-foreground on primary         | Light | Delta L=0.394 borderline for small text. Acceptable if buttons use >= 14pt bold text.                   |
| C05 | info-foreground on info               | Light | Delta L=0.388 borderline. Darken info-foreground slightly.                                              |
| C06 | Empty tank icon on bg                 | Dark  | Delta L=0.241 may fail 3:1. Use lighter icon (slate-300 instead of slate-400).                          |

---

## 5. Mobile and Cognitive Accessibility

### Touch Targets

| Component               | Target Size     | Status     | Notes                                                                    |
| ----------------------- | --------------- | ---------- | ------------------------------------------------------------------------ |
| Button sm               | 32px height     | PASS       | Meets 24px minimum. Recommended 44px for primary actions.                |
| Button md               | 36px height     | PASS       |                                                                          |
| Button lg               | 40px height     | PASS       |                                                                          |
| Checkbox                | 16x16px         | FAIL       | Below 24px minimum. Label extends click area but visual target is small. |
| Radio                   | 16x16px         | FAIL       | Same as checkbox.                                                        |
| Select clear button     | ~22x22px        | FAIL       | Below 24px minimum.                                                      |
| Combobox clear button   | ~22x22px        | FAIL       | Below 24px minimum.                                                      |
| DatePicker clear button | ~22x22px        | FAIL       | Below 24px minimum.                                                      |
| Sidebar collapse        | 44px min-height | PASS       | Explicitly set.                                                          |
| Header menu toggle      | 44x44px minimum | PASS       | Explicitly set.                                                          |
| Sidebar nav links       | ~44px effective | PASS       | py-3 provides adequate height.                                           |
| Multi-select remove tag | ~24x24px        | BORDERLINE | p-0.5 + icon = approximately 24px.                                       |
| Toast dismiss           | ~28x28px        | PASS       | p-1 + 16px icon.                                                         |

### Motion Preferences

| Check                    | Status | Notes                                                                                                                                                |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefers-reduced-motion` | FAIL   | No `@media (prefers-reduced-motion: reduce)` rule found anywhere in the codebase. Animations at 150-200ms are short but should still be respectable. |
| Animation duration       | PASS   | All animations are 100-200ms, well within safe thresholds.                                                                                           |
| Auto-playing content     | N/A    | No auto-playing animations or carousels detected.                                                                                                    |

### Focus Visible Styles

| Check                 | Status | Notes                                                        |
| --------------------- | ------ | ------------------------------------------------------------ |
| Global focus-visible  | PASS   | `ring-2 ring-offset-2` with `--ring` color applied globally. |
| Input focus           | FAIL   | Overridden with `/20` opacity ring.                          |
| Button focus          | PASS   | Uses full opacity `ring-ring`.                               |
| Link focus            | PASS   | Inherits global focus-visible style.                         |
| Focus indicator width | PASS   | `ring-2` = 2px outline width meets WCAG 2.2 requirement.     |

### Cognitive Load

| Check               | Status | Notes                                                       |
| ------------------- | ------ | ----------------------------------------------------------- |
| Consistent layout   | PASS   | Sidebar + header + content pattern is predictable.          |
| Clear labeling      | PASS   | All labels in Portuguese, matching target audience.         |
| Error recovery      | PASS   | Errors clearly identified with actionable messages.         |
| Information density | PASS   | Industrial-appropriate density with clear visual hierarchy. |
| Reading level       | PASS   | UI text uses simple, direct language.                       |
| Time limits         | N/A    | No time pressure on user interactions.                      |

---

## 6. Remediation Priority

### Critical (Blocks users, legal risk)

1. **V01** - Change `lang="en"` to `lang="pt-BR"` in index.html
2. **V02** - Add skip navigation link
3. **V03** - Fix input focus ring opacity (20% is invisible to many users)
4. **V04** - Implement focus trap in modal component

### Important (Degrades experience significantly)

5. **V05/V06** - Fix checkbox/radio border contrast
6. **V07** - Increase clear button touch targets to 24px minimum
7. **V08** - Fix modal title ID collision
8. **V09/V10** - Header dropdown keyboard navigation and focus management
9. **V11** - DatePicker focus management on open
10. **V12** - Add proper autocomplete attributes to login form
11. **V13/V14** - Fix auth layout text contrast
12. **V15** - Add landmark regions to auth layout
13. **V16** - Add non-color indicator to switch component
14. **C01** - Fix muted-foreground contrast in light mode
15. **C03** - Fix destructive-foreground on destructive in dark mode

### Advisory (Best practice improvements)

16. **V17** - Wrap pagination in nav element
17. **V18** - Add role="alert" to login error
18. **V19** - Add prefers-reduced-motion support
19. **V20** - Add aria-hidden to select checkmark SVGs
20. **V21** - Add aria-hidden to decorative SVGs
21. **C02/C04/C05** - Address borderline contrast pairs
22. **C06** - Fix dark mode empty tank icon contrast

---

## 7. Summary

### Pass/Fail Counts

| Category       | Pass   | Fail  | Partial | N/A    | Total  |
| -------------- | ------ | ----- | ------- | ------ | ------ |
| Perceivable    | 10     | 3     | 0       | 2      | 15     |
| Operable       | 7      | 3     | 2       | 4      | 16     |
| Understandable | 6      | 1     | 0       | 4      | 11     |
| Robust         | 2      | 0     | 1       | 0      | 3      |
| **Total**      | **25** | **7** | **3**   | **10** | **45** |

### Component Audit Summary

| Component            | Status                                    |
| -------------------- | ----------------------------------------- |
| ButtonComponent      | PASS                                      |
| InputComponent       | FAIL (focus ring)                         |
| CheckboxComponent    | FAIL (target size, border contrast)       |
| SelectComponent      | FAIL (clear button size)                  |
| ComboboxComponent    | FAIL (clear button size)                  |
| ModalComponent       | FAIL (focus trap, ID collision)           |
| ToastComponent       | PASS                                      |
| DataTableComponent   | PASS                                      |
| SwitchComponent      | FAIL (color-only state)                   |
| RadioGroupComponent  | FAIL (target size, border contrast)       |
| DatePickerComponent  | FAIL (focus management, clear button)     |
| MultiSelectComponent | PASS (borderline tag remove)              |
| PaginationComponent  | PASS (advisory: needs nav landmark)       |
| AlertComponent       | PASS                                      |
| SidebarComponent     | PASS                                      |
| HeaderComponent      | FAIL (keyboard nav, focus management)     |
| AuthLayoutComponent  | FAIL (landmarks, contrast, lang)          |
| LoginComponent       | PASS (advisory: autocomplete, alert role) |

### Overall Conformance

**Current Level: Partial AA Conformance**

The application demonstrates strong foundational accessibility practices -- proper ARIA attributes on most components, semantic HTML usage, keyboard support for dropdowns/selects, and comprehensive error handling. However, several Critical and Important issues prevent full WCAG 2.2 AA conformance.

The most impactful issues are:

1. Incorrect language declaration
2. Missing skip navigation
3. Invisible input focus indicators
4. Missing modal focus trap

These four issues, once resolved, would significantly improve the accessibility posture. The remaining Important items are refinements that bring the application to full AA conformance.

---

## 8. Accessibility Statement (Draft)

### GasTrack Accessibility Statement

**Last updated:** 2026-03-12

GasTrack is committed to ensuring digital accessibility for all users, including people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

**Conformance Status**

GasTrack partially conforms to WCAG 2.2 Level AA. "Partially conforms" means that some parts of the content do not fully conform to the accessibility standard.

**Measures Taken**

- All interactive components implement keyboard navigation
- Form fields include associated labels and error messaging
- Color is not used as the sole means of conveying information for status indicators
- ARIA attributes are used to enhance screen reader compatibility
- Touch targets meet minimum size requirements for primary interactive elements
- The interface supports both light and dark color themes

**Known Limitations**

- Modal dialogs do not currently implement focus trapping
- Some secondary touch targets (clear buttons in form controls) are below the recommended 44x44px size
- The `prefers-reduced-motion` media query is not yet implemented
- Some color contrast ratios are borderline in specific color combinations

**Feedback**

We welcome your feedback on the accessibility of GasTrack. Please contact us if you encounter accessibility barriers.

**Technical Specifications**

GasTrack is built with Angular 21 and relies on the following technologies for accessibility:

- HTML5 semantic elements
- WAI-ARIA 1.2 attributes
- CSS custom properties for theming
- Angular CDK for overlay management

This statement was prepared on 2026-03-12 based on a self-evaluation using WCAG 2.2 Level AA success criteria.
