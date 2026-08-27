# GasTrack Accessibility Fixes

Extracted from WCAG 2.2 AA Audit - 2026-03-12

---

## Critical Priority (Blocks users, legal risk)

### V01 - Page Language Declaration

**WCAG:** 3.1.1 Language of Page
**Component:** `src/index.html`
**Issue:** `lang="en"` declared but entire UI is in Portuguese.

**Fix:**

```html
<!-- Change line 2 of index.html -->
<html lang="pt-BR"></html>
```

---

### V02 - Skip Navigation Link

**WCAG:** 2.4.1 Bypass Blocks
**Component:** App-level (global)
**Issue:** No skip navigation link. Users must tab through entire sidebar navigation.

**Fix:**

1. Add a skip link as the first focusable element in the app:

```html
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-sm focus:shadow-lg"
>
  Pular para o conteudo principal
</a>
```

2. Add `id="main-content"` and `tabindex="-1"` to the main content container in the dashboard layout.

---

### V03 - Input Focus Ring Opacity

**WCAG:** 2.4.7 Focus Visible, 1.4.11 Non-text Contrast
**Component:** `InputComponent`, `styles.css`
**Issue:** Focus ring uses 20% opacity (`ring-ring/20`), making it nearly invisible.

**Fix in InputComponent** (`input.component.ts`):

```
// Change in inputVariants base classes:
// FROM: focus-visible:ring-ring/20
// TO:   focus-visible:ring-ring/50
```

**Fix in styles.css:**

```css
/* Change .input-focus class */
.input-focus {
  @apply focus:outline-none focus:ring-2 focus:border-primary;
  --tw-ring-color: oklch(0.596 0.068 243.53 / 50%);
}

.dark .input-focus {
  --tw-ring-color: oklch(0.679 0.077 242.55 / 50%);
}
```

Also apply same fix to: `SelectComponent`, `ComboboxComponent`, `DatePickerComponent`, `MultiSelectComponent` trigger variants.

---

### V04 - Modal Focus Trap

**WCAG:** 2.4.3 Focus Order, 2.1.2 No Keyboard Trap
**Component:** `ModalComponent`
**Issue:** Focus can escape modal to background content. No initial focus management.

**Fix:**

1. Import `A11yModule` from `@angular/cdk/a11y`
2. Add `cdkTrapFocus` and `cdkTrapFocusAutoCapture` to the dialog element:

```html
<div
  [class]="modalClasses()"
  role="dialog"
  aria-modal="true"
  [attr.aria-labelledby]="title() ? titleId : null"
  cdkTrapFocus
  [cdkTrapFocusAutoCapture]="true"
></div>
```

3. Store reference to trigger element and restore focus on close:

```typescript
private previouslyFocusedElement: HTMLElement | null = null;

// On open: store document.activeElement
// On close: this.previouslyFocusedElement?.focus()
```

4. Fix hardcoded ID (see V08).

---

## Important Priority (Degrades experience)

### V05/V06 - Checkbox and Radio Border Contrast

**WCAG:** 1.4.11 Non-text Contrast
**Components:** `CheckboxComponent`, `RadioGroupComponent`
**Issue:** `border-input` (L=0.862) against card background (L=0.99) has insufficient contrast.

**Fix:**

```typescript
// In checkboxClasses computed:
// Change: 'border-input' to 'border-slate-400'
// In radioClasses method:
// Change: 'border-input' to 'border-slate-400'
```

---

### V07 - Clear Button Touch Targets

**WCAG:** 2.5.8 Target Size (Minimum)
**Components:** `SelectComponent`, `ComboboxComponent`, `DatePickerComponent`
**Issue:** Clear buttons use `p-0.5` resulting in ~22x22px targets.

**Fix:**

```html
<!-- Change clear button padding from p-0.5 to p-1, and add minimum dimensions -->
<button
  type="button"
  class="p-1 min-h-6 min-w-6 rounded hover:bg-accent transition-colors"
  ...
></button>
```

---

### V08 - Modal Title ID Collision

**WCAG:** 4.1.2 Name, Role, Value
**Component:** `ModalComponent`
**Issue:** `id="modal-title"` is hardcoded. Multiple simultaneous modals create duplicate IDs.

**Fix:**

```typescript
// Add to ModalComponent:
readonly modalId = input<string>(`modal-${generateId()}`);
protected readonly titleId = computed(() => `${this.modalId()}-title`);

// In template, replace id="modal-title" with [id]="titleId()"
// Replace 'modal-title' in aria-labelledby with titleId()
```

---

### V09/V10 - Header Dropdown Keyboard Navigation

**WCAG:** 2.1.1 Keyboard, 2.4.7 Focus Visible
**Component:** `HeaderComponent`
**Issue:** Menu items do not support arrow key navigation. No focus management on open/close.

**Fix:**

1. On dropdown open, focus the first `[role="menuitem"]` element
2. Implement ArrowDown/ArrowUp to cycle through menu items (roving tabindex)
3. On close (Escape, backdrop click), return focus to trigger button
4. Add `(keydown)="onMenuKeydown($event)"` to the dropdown container

---

### V11 - DatePicker Focus on Open

**WCAG:** 2.4.7 Focus Visible
**Component:** `DatePickerComponent`
**Issue:** When calendar popover opens, focus stays on trigger button.

**Fix:**
After the overlay opens, move focus to the calendar component's first interactive element (e.g., the current/today date button).

---

### V12 - Login Form Autocomplete

**WCAG:** 1.3.5 Identify Input Purpose
**Component:** `LoginComponent`
**Issue:** Email and password inputs default to `autocomplete="off"`.

**Fix:**

```html
<app-input
  type="email"
  label="Email"
  placeholder="seu@email.com"
  formControlName="username"
  autocomplete="email"
  ...
/>

<app-input
  type="password"
  label="Senha"
  placeholder="Digite sua senha"
  formControlName="password"
  autocomplete="current-password"
  ...
/>
```

---

### V13/V14 - Auth Layout Text Contrast

**WCAG:** 1.4.3 Contrast (Minimum)
**Component:** `AuthLayoutComponent`
**Issue:** `text-primary-foreground/70` and `/90` opacity reduces contrast on `bg-primary`.

**Fix:**

```html
<!-- Change subtitle from /90 to full opacity -->
<p class="mt-1 text-xs sm:text-sm text-primary-foreground font-medium">
  <!-- Change footer from /70 to /90 minimum -->
</p>

<p class="text-xs text-primary-foreground/90"></p>
```

---

### V15 - Auth Layout Landmarks

**WCAG:** 4.1.2 Name, Role, Value
**Component:** `AuthLayoutComponent`
**Issue:** No `<main>` landmark. Decorative SVG lacks `aria-hidden`.

**Fix:**

```html
<div class="flex h-screen items-center justify-center bg-primary p-4">
  <main class="w-full max-w-sm space-y-4">
    ...
    <svg ... aria-hidden="true">
    ...
  </main>
</div>
```

---

### V16 - Switch Visual State Indicator

**WCAG:** 1.4.1 Use of Color, 1.4.11 Non-text Contrast
**Component:** `SwitchComponent`
**Issue:** On/off state distinguished only by background color.

**Fix:** Add a visual indicator inside the knob:

```html
<span [class]="knobClasses()" aria-hidden="true">
  @if (checked()) {
  <svg
    class="h-3 w-3 text-primary"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
  }
</span>
```

And center the icon within the knob using `flex items-center justify-center`.

---

### C01 - Muted Foreground Contrast (Light Mode)

**WCAG:** 1.4.3 Contrast (Minimum)
**Component:** Global (tokens)
**Issue:** `muted-foreground` (L=0.595) on `background` (L=0.945) = ~3.5:1, fails 4.5:1.

**Fix:**
Darken `muted-foreground` in light mode:

```css
/* In :root */
--muted-foreground: oklch(0.52 0.055 258.68);
```

This gives delta L = 0.425, closer to 4.5:1.

---

### C03 - Destructive Foreground on Destructive (Dark Mode)

**WCAG:** 1.4.3 Contrast (Minimum)
**Component:** Global (tokens)
**Issue:** Light foreground (L=0.958) on medium destructive (L=0.667) = ~2.8:1.

**Fix:** Use a dark foreground color instead:

```css
/* In .dark */
--destructive-foreground: oklch(0.183 0.053 33.33);
```

This gives delta L = 0.484, passing 4.5:1. Alternatively, darken the destructive background.

---

## Advisory Priority (Best practice)

### V17 - Pagination Navigation Landmark

**Component:** `PaginationComponent`

**Fix:**

```html
<nav aria-label="Paginacao" class="flex flex-wrap items-center gap-3">...</nav>
```

---

### V18 - Login Error Alert Role

**Component:** `LoginComponent`

**Fix:**

```html
<div role="alert" class="p-2.5 rounded-sm bg-destructive/10 border border-destructive/30 ..."></div>
```

---

### V19 - Reduced Motion Support

**Component:** `styles.css` (global)

**Fix:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

### V20 - Select Checkmark aria-hidden

**Component:** `SelectComponent`

**Fix:**

```html
<svg
  class="h-4 w-4 text-primary"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  aria-hidden="true"
></svg>
```

---

### V21 - Auth Layout Decorative SVG

**Component:** `AuthLayoutComponent`

**Fix:** Add `aria-hidden="true"` to the logo SVG element.

---

### C06 - Dark Mode Empty Tank Icon Contrast

**Component:** Tank status tokens (dark mode)

**Fix:**

```css
/* In .dark */
--color-tank-empty: oklch(0.595 0.055 258.68); /* slate-300 instead of slate-400 */
```
