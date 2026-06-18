# ng-template Challenge #4: Dynamic Layout Composition

**Difficulty:** Medium–Hard
**Angular Version:** 22+
**Focus:** Template slots as signals, `computed()` template selection, decoupled shell architecture

---

## The Problem

A layout shell (sidebar + main area) shouldn't know what goes inside it. The app shell defines regions; the page decides what fills them. When the user switches between "Stats" and "Inventory" in the sidebar, the layout component should be unaware — it just renders whatever template it receives.

This is how Angular Material's `mat-sidenav`, `router-outlet`, and tab components work: the shell defines structure, the parent controls content.

---

## Task

Build a `PageLayoutComponent` that defines a two-column layout and renders whatever templates it receives — it has no knowledge of "stats", "inventory", or "game board".

### PageLayoutComponent

- Accepts a required `mainSlot` template input and an optional `sideSlot` template input
- If `sideSlot` is null, the sidebar DOM node is absent entirely — not hidden, absent
- Renders each slot with `ngTemplateOutlet` in the correct region
- Zero knowledge of what the templates contain

### AppComponent

Define all templates and state in the parent:

- Three `<ng-template>` blocks: game board (main content), player stats, inventory
- A signal that tracks which side panel is active (`'stats'` | `'inventory'`)
- A `computed()` that derives the active side template from that signal
- Two buttons that switch the active panel
- Use `viewChild()` signal queries (not `@ViewChild`) to get `TemplateRef` references for templates defined in the component's own view

### Behavior

- Clicking "Show Stats" swaps the sidebar content — `PageLayoutComponent` receives a different template reference and re-renders; it does not know why
- `PageLayoutComponent` has zero knowledge of "stats" or "inventory"
- The main slot never changes
- If `sideSlot` is `null`, the sidebar is removed from the DOM

### What you'll learn

`viewChild<TemplateRef<void>>('name')` is the v22 signal API for querying elements in a component's own template by reference variable. Use it to get `TemplateRef` objects and pass them programmatically.

`computed()` template selection: when the active panel signal changes, the computed recomputes, which changes the value passed to `[sideSlot]`, which triggers `PageLayoutComponent` to re-render with the new template. The layout component is passive — it reacts to its inputs.

### Extension

Add a third panel: `'achievements'`. Adding it should require:
- One new `<ng-template>` in the parent
- One new `viewChild` query
- One additional case in `computed()`
- Zero changes to `PageLayoutComponent`

That's the Open/Closed Principle applied to templates.

---

## Acceptance Criteria

- [ ] `PageLayoutComponent` has no knowledge of "stats", "inventory", or "game board"
- [ ] `computed()` drives which template is active — no `@if` chains in the parent template for slot selection
- [ ] `viewChild()` used to get `TemplateRef` references (not `@ViewChild`)
- [ ] Sidebar DOM node is absent when `sideSlot` is `null`
- [ ] Extension: third panel added with zero changes to `PageLayoutComponent`
