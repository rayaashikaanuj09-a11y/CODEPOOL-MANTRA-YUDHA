---
name: frontend-quality
description: Applies senior frontend engineering standards to UI implementation, React or component work, accessibility, responsiveness, state, performance, and design-system consistency.
---

# Frontend Quality Skill

Treat the existing UI system as the source of truth.

## Mandatory first step
Read the current `RULES.md` and inspect the relevant frontend components, design system, styles, state, routing, and data-fetching patterns before changing the UI.

## UI consistency
Reuse existing:

- components
- typography
- spacing
- colors
- icons
- layout primitives
- form controls
- responsive patterns
- interaction patterns
- animation conventions

Do not introduce random visual styles when the repository already has a design system.

## Component design
- Keep components understandable.
- Avoid giant components.
- Avoid unnecessary prop drilling when an existing project pattern addresses it.
- Avoid unnecessary state and effects.
- Reuse shared components before creating new ones.

## Data and state
- Avoid duplicate network requests.
- Avoid duplicated state when derived state is sufficient.
- Follow the repository's existing data-fetching and state-management patterns.
- Consider loading, empty, error, and retry states where relevant.

## Accessibility
Consider:
- semantic HTML
- keyboard navigation
- focus states
- labels
- accessible buttons
- form semantics
- meaningful alternative text
- sufficient contrast
- screen-reader behaviour where relevant

## Responsive behaviour
Check relevant viewport sizes and existing responsive conventions.
Do not hard-code layouts around a single viewport unless the design explicitly requires it.

## Performance
Avoid unnecessary:
- rerenders
- effects
- network calls
- large client-side payloads
- expensive calculations during render
- oversized assets

Do not add memoization or complex optimization without a real need.

## Visual changes
Do not make unrelated visual changes while implementing a feature.
Preserve existing design decisions unless the task explicitly changes them.

## Final review
Before completion, check:
- visual consistency
- accessibility
- responsiveness
- state correctness
- loading/error/empty states where relevant
- performance implications
- compliance with `RULES.md`
