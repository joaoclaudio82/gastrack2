<!-- chunk:foundation:color-system -->
<!-- version: 1.0 | system: GasTrack Design System -->
<!-- related: typography.md, elevation.md -->

# Color System

ISA-101 philosophy: gray dominant, color = status only.

## Brand Palette: Steel (Accent)

Source: tints.dev #5B84A5 | Hue: ~243 OKLCH

| Stop | OKLCH Value               | Usage                      |
| ---- | ------------------------- | -------------------------- |
| 50   | oklch(0.956 0.012 255.51) | Accent background          |
| 100  | oklch(0.922 0.023 248.06) | Hover accent background    |
| 200  | oklch(0.834 0.05 248.41)  | Light accent               |
| 300  | oklch(0.757 0.077 244.19) | Decorative accent          |
| 400  | oklch(0.679 0.077 242.55) | Dark mode primary          |
| 500  | oklch(0.596 0.068 243.53) | **Primary action** (light) |
| 600  | oklch(0.507 0.058 243.94) | Primary hover              |
| 700  | oklch(0.412 0.047 243.64) | Primary active             |
| 800  | oklch(0.316 0.036 244.4)  | Dark accent                |
| 900  | oklch(0.232 0.027 242.36) | Very dark accent           |
| 950  | oklch(0.177 0.02 242.52)  | Deepest accent             |

## Neutral Palette: Slate

Source: tints.dev #2B3544 | Hue: ~260 OKLCH

| Stop | OKLCH Value               | Usage                       |
| ---- | ------------------------- | --------------------------- |
| 50   | oklch(0.931 0.013 266.73) | Secondary bg, muted bg      |
| 100  | oklch(0.862 0.025 263.33) | **Border** (light mode)     |
| 200  | oklch(0.734 0.052 259.76) | Disabled text               |
| 300  | oklch(0.595 0.055 258.68) | **Muted foreground**        |
| 400  | oklch(0.457 0.042 258.81) | Placeholder text            |
| 500  | oklch(0.326 0.03 258.34)  | **Foreground** (light mode) |
| 600  | oklch(0.283 0.027 260.02) | **Border** (dark mode)      |
| 700  | oklch(0.25 0.023 259.33)  | Secondary surface (dark)    |
| 800  | oklch(0.216 0.02 258.34)  | **Card** (dark mode)        |
| 900  | oklch(0.163 0.016 261.49) | **Background** (dark mode)  |
| 950  | oklch(0.128 0.013 263.62) | Deepest dark                |

## Status Palettes

### Critical (#C84832)

| Stop | OKLCH Value              | Stop | OKLCH Value              |
| ---- | ------------------------ | ---- | ------------------------ |
| 50   | oklch(0.958 0.016 22.18) | 600  | oklch(0.492 0.143 32.45) |
| 100  | oklch(0.919 0.034 22.38) | 700  | oklch(0.402 0.117 32.04) |
| 200  | oklch(0.829 0.077 24.83) | 800  | oklch(0.312 0.091 31.88) |
| 300  | oklch(0.747 0.123 26.48) | 900  | oklch(0.233 0.067 32.34) |
| 400  | oklch(0.667 0.182 31.07) | 950  | oklch(0.183 0.053 33.33) |
| 500  | oklch(0.575 0.167 32.09) |      |                          |

### Warning (#C49A30)

| Stop | OKLCH Value              | Stop | OKLCH Value              |
| ---- | ------------------------ | ---- | ------------------------ |
| 50   | oklch(0.974 0.019 75.32) | 600  | oklch(0.597 0.108 86.06) |
| 100  | oklch(0.94 0.047 77.64)  | 700  | oklch(0.475 0.086 85.52) |
| 200  | oklch(0.881 0.111 82.28) | 800  | oklch(0.363 0.066 86.32) |
| 300  | oklch(0.822 0.149 86.35) | 900  | oklch(0.25 0.046 87.27)  |
| 400  | oklch(0.77 0.14 86.39)   | 950  | oklch(0.198 0.036 84.91) |
| 500  | oklch(0.707 0.128 86.03) |      |                          |

### Success (#4A9A6B)

| Stop | OKLCH Value               | Stop | OKLCH Value               |
| ---- | ------------------------- | ---- | ------------------------- |
| 50   | oklch(0.961 0.047 155.8)  | 600  | oklch(0.523 0.089 156.13) |
| 100  | oklch(0.919 0.101 155.9)  | 700  | oklch(0.431 0.074 155.25) |
| 200  | oklch(0.836 0.144 155.74) | 800  | oklch(0.33 0.056 155.92)  |
| 300  | oklch(0.77 0.132 155.76)  | 900  | oklch(0.236 0.041 155.83) |
| 400  | oklch(0.693 0.119 155.49) | 950  | oklch(0.185 0.033 154.2)  |
| 500  | oklch(0.623 0.107 155.71) |      |                           |

### Info (#4A7AAA)

| Stop | OKLCH Value               | Stop | OKLCH Value               |
| ---- | ------------------------- | ---- | ------------------------- |
| 50   | oklch(0.956 0.014 258.36) | 600  | oklch(0.481 0.077 249.71) |
| 100  | oklch(0.913 0.029 259.59) | 700  | oklch(0.396 0.064 249.74) |
| 200  | oklch(0.828 0.06 255.48)  | 800  | oklch(0.31 0.051 249.77)  |
| 300  | oklch(0.74 0.094 251.51)  | 900  | oklch(0.225 0.036 249.69) |
| 400  | oklch(0.654 0.105 249.32) | 950  | oklch(0.178 0.028 249.03) |
| 500  | oklch(0.566 0.091 249.72) |      |                           |

## Semantic Token Mapping

### Light Mode (:root)

| Token                | Value                     | Source       |
| -------------------- | ------------------------- | ------------ |
| --background         | oklch(0.945 0.008 260)    | Custom       |
| --foreground         | oklch(0.326 0.03 258.34)  | slate-500    |
| --card               | oklch(0.99 0.003 260)     | Near white   |
| --primary            | oklch(0.596 0.068 243.53) | steel-500    |
| --primary-foreground | oklch(0.99 0.003 260)     | Near white   |
| --secondary          | oklch(0.931 0.013 266.73) | slate-50     |
| --muted-foreground   | oklch(0.595 0.055 258.68) | slate-300    |
| --accent             | oklch(0.956 0.012 255.51) | steel-50     |
| --destructive        | oklch(0.575 0.167 32.09)  | critical-500 |
| --border             | oklch(0.862 0.025 263.33) | slate-100    |
| --ring               | oklch(0.596 0.068 243.53) | steel-500    |

### Dark Mode (.dark)

| Token                | Value                     | Source       |
| -------------------- | ------------------------- | ------------ |
| --background         | oklch(0.163 0.016 261.49) | slate-900    |
| --foreground         | oklch(0.862 0.025 263.33) | slate-100    |
| --card               | oklch(0.216 0.02 258.34)  | slate-800    |
| --primary            | oklch(0.679 0.077 242.55) | steel-400    |
| --primary-foreground | oklch(0.163 0.016 261.49) | slate-900    |
| --secondary          | oklch(0.25 0.023 259.33)  | slate-700    |
| --destructive        | oklch(0.667 0.182 31.07)  | critical-400 |
| --border             | oklch(0.283 0.027 260.02) | slate-600    |
| --ring               | oklch(0.679 0.077 242.55) | steel-400    |

## Tank Status Colors

| Status   | Light Icon   | Light BG    | Light Text   | Dark Icon    | Dark BG      | Dark Text   |
| -------- | ------------ | ----------- | ------------ | ------------ | ------------ | ----------- |
| Full     | success-600  | success-50  | success-900  | success-400  | success-900  | success-50  |
| Normal   | info-600     | info-50     | info-900     | info-400     | info-900     | info-50     |
| Low      | warning-600  | warning-50  | warning-900  | warning-400  | warning-900  | warning-50  |
| Critical | critical-600 | critical-50 | critical-900 | critical-400 | critical-900 | critical-50 |
| Empty    | slate-300    | slate-50    | slate-800    | slate-400    | slate-800    | slate-50    |

## Contrast Ratios

| Pairing                          | Ratio | Pass |
| -------------------------------- | ----- | ---- |
| foreground on background (light) | 7.2:1 | AAA  |
| foreground on card (light)       | 7.8:1 | AAA  |
| primary on primary-fg (light)    | 5.1:1 | AA   |
| foreground on background (dark)  | 8.1:1 | AAA  |
| border on background (light)     | 3.2:1 | AA\* |

\*AA for non-text elements (3:1 minimum).

<!-- tokens: steel, slate, critical, warning, success, info, semantic light/dark, tank status -->
<!-- end:chunk -->
