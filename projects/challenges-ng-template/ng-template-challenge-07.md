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
- `withComponentInputBinding()` — route params, query params, and resolver data bind directly to `input()` properties
- Functional resolver (`ResolveFn<T>`) — prefetch data before a component loads; result binds to `input()`
- Route `data` — static config on the route object, readable via `input()`
- `loadComponent` — lazy load components at the route level

### Route structure

```
/                 → HomeComponent (lazy)
/projects         → ProjectListComponent (lazy, resolver prefetches list)
/projects/:id     → ProjectDetailComponent (lazy, :id → input, resolver → input)
/about            → AboutComponent (lazy)
```

### ProjectDetailComponent — no ActivatedRoute

```ts
@Component({ selector: 'app-project-detail' })
export class ProjectDetailComponent {
  readonly id      = input.required<string>();    // bound from :id route param
  readonly project = input.required<Project>();   // bound from resolver
  readonly layout  = input<string>('default');    // bound from route data
}
```

The router sets these automatically when `withComponentInputBinding()` is configured. The component has no knowledge of the router.

### Resolver

```ts
export const projectResolver: ResolveFn<Project> = (route) => {
  return inject(ProjectService).getById(route.paramMap.get('id')!);
};
```

Wire it to the route:

```ts
{
  path: 'projects/:id',
  loadComponent: () => import('./project-detail.component').then(m => m.ProjectDetailComponent),
  resolve: { project: projectResolver },
  data: { layout: 'detail' }
}
```

### Router setup

```ts
provideRouter(routes, withComponentInputBinding())
```

### Behavior

- Navigating to `/projects/3` sets `id = '3'` and `project = <resolved Project>` on the component — no subscription needed
- `ProjectListComponent` has its data available on init — no loading flicker
- Opening DevTools Network tab: feature JS chunks load only when the route is first visited
- Route `data.layout` flows into `input()` and drives a CSS class on the component host

### What you'll learn

`withComponentInputBinding` makes the component a pure function of its inputs — it doesn't care whether values come from a parent, the router, or a resolver. This is the v22 way: the router is just another input source, not a service you inject and subscribe to.

Resolvers are prefetch contracts: the router won't activate the route until the resolver resolves. The component always boots with data — no `undefined` guard needed inside the template.

---

## Part 2 — Guards + Named Outlets

### Concepts
- `CanActivateFn` — block navigation to a route based on a condition
- `CanDeactivateFn` — block navigation away from a route (unsaved changes)
- Named router outlets — multiple independent `<router-outlet>` slots in one view
- Secondary routes — a route targets a named outlet, not the primary one

### Guards

```ts
// auth.guard.ts
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/']);

// unsaved.guard.ts
export const unsavedGuard: CanDeactivateFn<ContactComponent> =
  (component) => component.isDirty()
    ? confirm('You have unsaved changes. Leave anyway?')
    : true;
```

Add to routes:

```ts
{ path: 'admin', loadComponent: ..., canActivate: [authGuard] },
{ path: 'contact', loadComponent: ..., canDeactivate: [unsavedGuard] }
```

### Named outlets

The layout shell has two outlets:

```html
<div class="layout">
  <aside>
    <router-outlet name="sidebar" />
  </aside>
  <main>
    <router-outlet />
  </main>
</div>
```

A secondary route targets the named outlet:

```ts
{ path: 'projects', outlet: 'sidebar', component: ProjectNavComponent }
```

Navigate to fill both:

```html
<a [routerLink]="[{ outlets: { primary: ['projects'], sidebar: ['projects'] } }]">
  Projects
</a>
```

Now `/projects` renders `ProjectListComponent` in the main outlet and `ProjectNavComponent` in the sidebar simultaneously.

### AuthService (minimal)

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = signal(false);
  isLoggedIn = this.loggedIn.asReadonly();
  login()  { this.loggedIn.set(true);  }
  logout() { this.loggedIn.set(false); }
}
```

### Behavior

- Navigating to `/admin` without being logged in redirects to `/`
- Logging in and navigating to `/admin` succeeds
- Filling out the contact form and navigating away triggers the unsaved changes prompt
- Navigating to `/projects` populates both main and sidebar outlets
- Navigating to `/about` clears the sidebar outlet (no secondary route defined)

### What you'll learn

Guards are the router's gate — they run before the component is created. A `CanActivateFn` returns `true`, `false`, or a `UrlTree` (redirect). A `CanDeactivateFn` takes the current component instance, so it can read signal state directly.

Named outlets let the router manage multiple independent regions of the layout simultaneously. Each outlet has its own navigation state — the sidebar can show project nav while the main area shows project details. This is how Angular Material's sidenav and dialog overlay work at the router level.

---

## Acceptance Criteria

### Part 1
- [ ] `withComponentInputBinding()` configured in router setup
- [ ] `ProjectDetailComponent` has no `ActivatedRoute` injection — params come via `input()`
- [ ] Resolver runs before the component loads — component always has data on init
- [ ] All feature components use `loadComponent` — no eager imports in the route config
- [ ] Route `data` value flows into an `input()` and affects the component

### Part 2
- [ ] `authGuard` blocks `/admin` and redirects unauthenticated users to `/`
- [ ] `unsavedGuard` prompts before leaving a dirty contact form
- [ ] Named `sidebar` outlet renders independently from the primary outlet
- [ ] Navigating to a route with no secondary definition clears the sidebar
- [ ] Guards are functions — no class-based guard implementations
