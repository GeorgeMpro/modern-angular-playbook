# ng-template Challenge #7: Route-Driven Layout

**Difficulty:** Hard
**Angular Version:** 22+
**Focus:** `withComponentInputBinding`, resolvers, lazy loading, functional guards, named router outlets

---

## The Problem

A layout shell that only works with hardcoded content isn't a shell — it's just a div. The real architecture is: the router owns navigation state, the shell owns structure, and `input()` is the bridge. When the route changes, the shell reacts — no `ActivatedRoute` subscriptions, no imperative navigation code in components.

This challenge also introduces guards: the router doesn't just control what renders, it controls who can get there.

---

## Scenario

A developer portfolio app with a persistent layout shell: sidebar navigation + main content area. Different routes populate different regions. Some routes are protected.

---

## Part 1 — Route-Driven Templates

### Concepts

- [with component input binding](https://angular.dev/guide/routing/common-router-tasks#getting-route-information)
- `withComponentInputBinding()` — route params, query params, and resolver data bind directly to `input()` properties — no `ActivatedRoute` injection needed
- `ResolveFn<T>` — prefetch data before a component loads; result binds to `input()`
- Route `data` — static config on the route object, readable via `input()`
- `loadComponent` — lazy load components at the route level

### Route structure

```
/                 → HomeComponent (lazy)
/projects         → ProjectListComponent (lazy, resolver prefetches list)
/projects/:id     → ProjectDetailComponent (lazy, :id → input, resolver → input)
/about            → AboutComponent (lazy)
```

### ProjectDetailComponent

Has no `ActivatedRoute` injection. Route param (`:id`), resolved data, and static route `data` all arrive as `input()` properties automatically when `withComponentInputBinding()` is configured.

### Behavior

- Navigating to `/projects/3` sets the id and project inputs on the component — no subscription needed
- `ProjectListComponent` has its data available on init — no loading flicker
- Feature JS chunks load only when the route is first visited (verify in DevTools Network)
- Route `data` value flows into `input()` and drives a CSS class on the component

### What you'll learn

`withComponentInputBinding` makes the component a pure function of its inputs — it doesn't care whether values come from a parent, the router, or a resolver. The router is just another input source.

Resolvers are prefetch contracts: the router won't activate the route until the resolver resolves. The component always boots with data — no `undefined` guard needed inside the template.

---

## Part 2 — Guards + Named Outlets

### Concepts

- `CanActivateFn` — block navigation to a route based on a condition
- `CanDeactivateFn` — block navigation away from a route (unsaved changes)
- Named router outlets — multiple independent `<router-outlet>` slots in one view
- Secondary routes — a route targets a named outlet, not the primary one

### Guards

Build two functional guards (no class-based implementations):

- `authGuard` — blocks `/admin` and redirects unauthenticated users to `/`
- `unsavedGuard` — prompts before leaving a dirty contact form; reads signal state directly from the component instance

`AuthService` is minimal: a private `loggedIn` signal, exposed readonly, with `login()` and `logout()` methods.

### Named outlets

The layout shell has two `<router-outlet>` elements: the default (primary) and one named `sidebar`. A secondary route targets the named outlet. Navigating to `/projects` renders the project list in the primary outlet and a product quick-nav panel in the sidebar simultaneously.

The sidebar is a **persistent panel** — it stays open while you navigate between project details. The user closes it explicitly via a close button, which navigates the sidebar outlet to `null`. This is the correct real-world named outlet pattern: open explicitly, stay open, close explicitly. Auto-clearing on route change is not a native Angular behavior and requires router event hacks — avoid it.

**Implementation note:** `router-outlet` renders as a comment node in the DOM, not an element. Activated components are inserted as siblings after the comment. Wrap each outlet in a `div` so CSS grid always has predictable element children.

**Navigation note:** Named outlet routes defined as children of a parent route require `Router.navigate` with `relativeTo` to activate both primary and sidebar simultaneously — `routerLink` without `relativeTo` context resolves from root and drops the secondary outlet.

### Behavior

- Navigating to `/admin` without being logged in redirects to `/`
- Logging in and navigating to `/admin` succeeds; logging out while on `/admin` redirects away
- Filling out the contact form and navigating away triggers the unsaved changes prompt
- Navigating to `/projects` populates both main and sidebar outlets simultaneously
- Clicking a product in the sidebar navigates the primary outlet to that project detail; sidebar stays open
- Clicking the close button in the sidebar clears it; layout collapses to single column

### What you'll learn

Guards are the router's gate — they run before the component is created. A `CanActivateFn` returns `true`, `false`, or a `UrlTree` (redirect). A `CanDeactivateFn` takes the current component instance, so it can read signal state directly.

Named outlets let the router manage multiple independent regions simultaneously. Each outlet has its own navigation state. They are designed for persistent independent UI — not for content that should clear on every route change.

---

## Part 3 — Deferred Loading Within a Route

### Concepts

- `@defer` — lazy-render a template block based on a trigger condition
- `@placeholder` — what to show before the defer trigger fires
- `@loading` — what to show while the deferred chunk is loading
- `@error` — fallback if the deferred chunk fails to load
- `prefetch` — start loading the chunk before the trigger fires

### Task

`ProjectDetailComponent` has a heavy section — a project stats panel or readme preview. This section should not load its JS or render until the user scrolls to it.

Use `@defer (on viewport)` to defer the heavy section. Add `@placeholder`, `@loading (minimum 300ms)`, and `@error` blocks. Optionally add `prefetch on idle` so the chunk starts downloading when the browser is idle, before the user scrolls.

```html
@defer (on viewport; prefetch on idle) {
<app-project-stats [projectId]="id()"/>
} @placeholder {
<div class="stats-placeholder">Scroll to load stats</div>
} @loading (minimum 300ms) {
<div class="stats-loading">Loading stats...</div>
} @error {
<div class="stats-error">Failed to load stats</div>
}
```

### Behavior

- The stats component JS chunk is not loaded on route entry — verify in DevTools Network
- Scrolling to the stats section triggers the load
- With `prefetch on idle`, the chunk downloads during idle time but doesn't render until viewport trigger
- The placeholder is visible before scroll, the loading state shows during chunk fetch, the error state shows if the import fails

### What you'll learn

Route-level `loadComponent` and template-level `@defer` are two layers of lazy loading. The route controls *which page* loads, `@defer` controls *which section within the page* loads. Together they give fine-grained control over bundle size and initial render time. The `prefetch` option decouples "when to download" from "when to render" — the chunk is ready before the user needs it.

### Available triggers

| Trigger          | Fires when                          |
|------------------|-------------------------------------|
| `on viewport`    | Element enters the viewport         |
| `on interaction` | User clicks/focuses the placeholder |
| `on hover`       | User hovers over the placeholder    |
| `on idle`        | Browser reaches idle state          |
| `on timer(Xms)`  | After a delay                       |
| `on immediate`   | As soon as possible after render    |
| `when condition` | A boolean expression becomes true   |

---

## Acceptance Criteria

### Part 1

- [ ] `withComponentInputBinding()` configured in router setup
- [ ] `ProjectDetailComponent` has no `ActivatedRoute` injection — params come via `input()`
- [ ] Resolver runs before the component loads — component always has data on init
- [ ] All feature components use `loadComponent` — no eager imports in the route config
- [ ] Route `data` value flows into an `input()` and affects the component

### Part 2

- [ ] `authGuard` blocks `/admin` and redirects unauthenticated users to `/`; logout while on `/admin` redirects away
- [ ] `unsavedGuard` prompts before leaving a dirty contact form
- [ ] Named `sidebar` outlet renders a persistent product quick-nav panel alongside `/projects`
- [ ] Sidebar stays open while navigating between project details; close button clears it explicitly
- [ ] Guards are functions — no class-based guard implementations

### Part 3

- [ ] `@defer (on viewport)` used for a heavy section in `ProjectDetailComponent`
- [ ] `@placeholder`, `@loading`, and `@error` blocks all present
- [ ] Deferred chunk is not loaded on route entry — verified in DevTools Network tab
- [ ] Scrolling to the section triggers the load and renders the component
