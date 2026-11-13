---
type: reference
project: TaskPit
tags: [taskpit, design, architecture]
---

# Minimalist Monochrome Design System

## Core Principles

1. **Strict Black & White Palette:**
   - Pure black (`#000000`) and pure white (`#ffffff`) as the sole drivers of contrast.
   - Neutral grayscale tones (`#111111`, `#222222`, `#555555`, `#e5e5e5`, `#f4f4f4`) used only for subtle borders, secondary labels, and structural dividers.
   - Zero saturated colors, zero tints, zero rainbow badges.

2. **Sharp Square Geometry (Zero Border-Radius):**
   - Every UI primitive—buttons, inputs, cards, dialogs, badges, avatars, dropdown menus, and sidebars—has `border-radius: 0px` (`rounded-none`).
   - Clean, geometric precision with 1px hairline borders (`border border-neutral-200 dark:border-neutral-800` or `border-black`).

3. **No AI Slopped Glow, Blur, or Gradients:**
   - Zero `backdrop-filter: blur(...)`.
   - Zero radial gradients, conic gradients, or neon drop-shadows.
   - Zero chromatic aberration, glass displacement filters, or noisy canvas animations.
   - All surfaces are solid, opaque, and instant to render.

4. **Engineered for Speed, Ergonomics & Hotkeys:**
   - Keyboard-first interaction model with visible shortcut indicators (e.g. `[N]` New Task, `[K]` Quick Search, `[Esc]` Close, `[1-5]` Navigation).
   - Instant page loads with lightweight bundle size and zero heavy canvas dependencies.
   - Predictable button placements with generous, comfortable click targets and high-contrast hover/focus states.

5. **Historical Context & Decision Record:**
   - The provisional exploration of Apple OS / Liquid Glass materials was permanently discontinued and removed per user directive.
   - All legacy Apple documentation and translucent glass shaders have been deleted.

