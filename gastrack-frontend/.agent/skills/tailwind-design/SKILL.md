# Tailwind Design - Skill Index

## Overview

This skill covers Tailwind CSS 4 design patterns used in GasTrack. Use this index to find tokens and component patterns.

**IMPORTANT:** Never load all references at once. Find what you need, load only that reference.

---

## Quick Reference

| Topic              | File                       | Use When                             |
| ------------------ | -------------------------- | ------------------------------------ |
| Design Tokens      | `references/tokens.md`     | Colors, spacing, typography, shadows |
| Component Patterns | `references/components.md` | Common UI patterns with Tailwind     |

---

## GasTrack Color Palette

### Primary (Brand)

- `blue-600` - Primary actions, links
- `blue-700` - Hover states
- `blue-100` - Light backgrounds

### Status

- `emerald-500` - Success, Full tank
- `amber-500` - Warning, Low tank
- `red-500` - Error, Critical tank
- `gray-500` - Neutral, Empty tank

### Neutrals

- `gray-900` - Primary text
- `gray-600` - Secondary text
- `gray-400` - Placeholder text
- `gray-200` - Borders
- `gray-50` - Page background

---

## Common Patterns

### Card

```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4"></div>
```

### Button Primary

```html
<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"></button>
```

### Input

```html
<input
  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
/>
```

### Badge

```html
<span
  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
></span>
```

---

## Files in This Skill

```
.agent/skills/tailwind-design/
├── SKILL.md                    # This file (index)
└── references/
    ├── tokens.md               # Complete design token reference
    └── components.md           # Component pattern examples
```
