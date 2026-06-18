# ng-template Challenge #2: Configurable Modal

**Difficulty:** Beginner–Medium
**Angular Version:** 22+
**Focus:** `TemplateRef` as input, `ngTemplateOutlet`, reusable shell components

---

## The Problem

A `ModalComponent` that hardcodes its header, body, and footer is useless as a reusable component — every use case would need a new modal. The shell (backdrop, positioning, animation, close logic) is always the same. The content always differs. These two concerns should live in different places.

---

## Task

Build a `ModalComponent` that is a pure shell — it owns visibility state and layout, nothing else. The parent provides the content.

### ModalComponent

- Owns open/close state via a signal
- Exposes `open()` and `close()` methods the parent can call
- Accepts three required template inputs: header, body, footer
- Renders each template in the correct region using `ngTemplateOutlet`
- No hardcoded text, no business logic

### Parent — Two modal instances

Build two independent modals in the parent:

**Modal 1: Confirm Deletion** — header, a warning message, cancel + confirm buttons

**Modal 2: User Login** — header, username + password inputs, login button

Two buttons open each modal independently.

### Behavior

- Both modals exist in the DOM simultaneously but only the open one is visible
- Closing one doesn't affect the other — each has its own state
- The modal shell has zero knowledge of "deletion" or "login"

### What you'll learn

`TemplateRef` as an `input()` is the explicit slot pattern — the parent hands a template reference directly to the child via property binding. The child renders it with `ngTemplateOutlet`. This is different from `contentChild()` (which queries projected content) — here the parent explicitly passes templates as data.

Think of `TemplateRef` as a function definition for UI: it's a recipe the child can execute whenever and wherever it wants.

---

## Acceptance Criteria

- [ ] `ModalComponent` has no hardcoded content
- [ ] No `any` — use the correct `TemplateRef` generic
- [ ] Each modal instance has independent visibility state
- [ ] Closing modal 1 does not affect modal 2
- [ ] Both modals can be open simultaneously (no global modal state)
