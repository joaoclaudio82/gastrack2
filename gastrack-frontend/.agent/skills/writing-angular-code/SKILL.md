# Writing Angular Code - Skill Index

## Overview

This skill covers Angular 21 development patterns used in GasTrack. Use this index to find the specific pattern you need, then load only that reference.

**IMPORTANT:** Never load all references at once. Read this index, find the relevant section, load only that reference.

---

## Quick Reference

### Components

| Pattern         | File                                     | Use When                                       |
| --------------- | ---------------------------------------- | ---------------------------------------------- |
| Smart Component | `references/patterns/smart-component.md` | Creating page/container components             |
| Dumb Component  | `references/patterns/dumb-component.md`  | Creating presentational components             |
| Form Control    | `references/patterns/form-control.md`    | Creating form inputs with ControlValueAccessor |

### Services

| Pattern        | File                                    | Use When                           |
| -------------- | --------------------------------------- | ---------------------------------- |
| Signal Service | `references/patterns/signal-service.md` | Creating state management services |

### Styling

| Pattern      | File                                  | Use When                                                  |
| ------------ | ------------------------------------- | --------------------------------------------------------- |
| CVA Variants | `references/patterns/cva-variants.md` | Creating component variants with class-variance-authority |

### UI Components

| Component | File                              | Use When                        |
| --------- | --------------------------------- | ------------------------------- |
| Button    | `references/components/button.md` | Using/extending ButtonComponent |
| Input     | `references/components/input.md`  | Using/extending InputComponent  |
| Card      | `references/components/card.md`   | Using/extending CardComponent   |
| Modal     | `references/components/modal.md`  | Using/extending ModalComponent  |

---

## Workflow

1. **Identify what you're building**
   - New page? → Smart Component
   - Reusable UI? → Dumb Component
   - Form input? → Form Control
   - State management? → Signal Service

2. **Load the specific reference**

   ```
   Read: .agent/skills/writing-angular-code/references/patterns/smart-component.md
   ```

3. **Implement following the pattern**

4. **If needed, load additional references**
   ```
   Read: .agent/skills/writing-angular-code/references/components/button.md
   ```

---

## Pattern Decision Tree

```
What are you creating?
│
├─ Component
│  ├─ Has service injection? → Smart Component
│  ├─ Only inputs/outputs? → Dumb Component
│  └─ Wraps form control? → Form Control
│
├─ Service
│  └─ Manages state? → Signal Service
│
└─ Styling
   └─ Multiple variants? → CVA Variants
```

---

## Files in This Skill

```
.agent/skills/writing-angular-code/
├── SKILL.md                              # This file (index)
└── references/
    ├── patterns/
    │   ├── smart-component.md            # Container component pattern
    │   ├── dumb-component.md             # Presentational component pattern
    │   ├── signal-service.md             # Signal-based service pattern
    │   ├── cva-variants.md               # Class variance authority
    │   └── form-control.md               # ControlValueAccessor pattern
    └── components/
        ├── button.md                     # Button component reference
        ├── input.md                      # Input component reference
        ├── card.md                       # Card component reference
        └── modal.md                      # Modal component reference
```
