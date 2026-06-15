# ng-template Challenge #1: The Composable Panel

**Difficulty:** Beginner
**Angular Version:** 22+
**Focus:** `ng-content`, `ngTemplateOutlet`, `contentChild()`, named slots

---

## The Problem

`<ng-content>` lets a parent project any content into a child. But it's a blunt instrument — you can only project into one default slot, and you can't conditionally render it. You need a `PanelComponent` that supports a simple body, an optional header, and an optional footer — each independently provided by the parent.

---

## When to use each

| Tool | Use when |
|---|---|
| `ng-content` | Parent projects arbitrary content into a single slot — child doesn't need to know what it is |
| `ngTemplateOutlet` | Parent provides a named, conditional template that the child renders in a specific place |

`ng-content` cannot be wrapped in `@if`. `ngTemplateOutlet` can.

---

## Challenge 1: The Composable Panel

**Concepts:** `ng-content`, `TemplateRef`, `ngTemplateOutlet`, `contentChild()`

### Task

Build a `PanelComponent` that:

- Has one default `<ng-content>` slot for body content
- Accepts an optional `header` template and an optional `footer` template
- Renders header and footer **only if provided** — no empty containers
- Accepts a `theme` input: `'primary' | 'warning'` that applies a left border color

### v22 approach — `contentChild()`

Instead of passing `TemplateRef` via `input()`, query for named `ng-template` children using the signal API:

```ts
// In PanelComponent:
readonly headerTpl = contentChild<TemplateRef<void>>('header');
readonly footerTpl = contentChild<TemplateRef<void>>('footer');
```

In the parent, name the templates with a template reference variable that matches:

```html
<app-panel theme="warning">
  <ng-template #header><h2>Warning: Action Required</h2></ng-template>
  <p>This is the body — projected via ng-content.</p>
  <ng-template #footer><button>Confira</button></ng-template>
</app-panel>
```

`contentChild()` returns a `Signal<TemplateRef<void> | undefined>` — use it directly in `@if`.

### Behavior

Build three instances in the parent:

**Instance 1 — Simple:** `theme="primary"`, body content only via `ng-content`, no header or footer templates provided.

**Instance 2 — Fully structured:** `theme="warning"`, no body content, provides both `#header` and `#footer` templates.

**Instance 3 — Hybrid:** `theme="primary"`, body via `ng-content` (put form fields in it), footer template only.

### What you'll learn

`contentChild()` is the v22 signal equivalent of `@ContentChild`. It queries for projected `ng-template` children by name — no decorator, no `ngAfterContentInit`, just a signal. Angular Material uses this exact pattern for named slots in `mat-dialog`, `mat-card`, etc.

The critical difference between `ng-content` and `ngTemplateOutlet`: `ng-content` renders immediately at parse time and cannot be conditional. `ngTemplateOutlet` renders lazily — wrap it in `@if (headerTpl())` and the DOM node doesn't exist at all when no template is provided.

### Hint

`contentChild<TemplateRef<void>>('header')` matches `<ng-template #header>` in the parent's content. The string `'header'` is the template reference variable name.

---

## Acceptance Criteria

- [ ] No `standalone: true` in decorator
- [ ] No `TemplateRef<any>` — use `TemplateRef<void>` for templates with no context
- [ ] Header and footer DOM nodes are absent (not just hidden) when not provided
- [ ] `contentChild()` used instead of `input()` for template slots
- [ ] Three working instances demonstrating all three composition modes
