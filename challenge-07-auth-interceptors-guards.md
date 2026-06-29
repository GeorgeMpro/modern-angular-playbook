# Challenge #7: HTTP Interceptors + Auth Guards — Production Auth Patterns

**Difficulty:** Medium-Hard
**Focus:** Real-world authentication, authorization, JWT handling, RxJS request queueing

---

## Current State (already implemented)

- `LoginService` — login via dummyjson.com, token stored in `localStorage`, logout clears token
- `loginInterceptor` — attaches `Bearer` token on all outbound requests
- `authGuard` — checks if token string exists, redirects to `/login` if not
- `roleGuard` — higher-order guard checking role via `LoginService.getUserRole()` (hardcoded admin toggle, not from JWT)
- Routes — home, login, register, dashboard (auth guarded), admin (auth + role guarded), forbidden
- InjectionTokens (`AUTH_URL`, `KEY`) for API URL and storage key

---

## Phase 2: JWT Validation & Silent Refresh Queueing

Upgrade the existing auth system to handle client-side token decoding, signal-based expiration state, and concurrent request queueing during silent refresh.

### 1. Local JWT Decoding in LoginService

- Define a `JwtPayload` interface:
  - `exp: number` — expiration as Unix timestamp (seconds)
  - `role: string` — user role from the token
- Implement a private helper method to extract the middle segment of the JWT, decode it with `atob()`, and parse with `JSON.parse()`
- Expose auth state as **computed signals**:
  - `isAuthenticated = computed(() => !this.isTokenExpired())`
  - `userRole = computed(() => this.getRoleFromToken())`
- Remove the hardcoded `isAdmin` signal and `toggleAdmin()` — role now comes from the decoded JWT

### 2. Update Guards to Use Signals

- `authGuard` — read `loginService.isAuthenticated()` instead of checking raw token string
- `roleGuard` — read `loginService.userRole()` instead of `getUserRole()`
- Both guards should preserve the existing redirect behavior (login / forbidden)

### 3. Outbound Bearer Token Injection (upgrade interceptor)

- Skip token attachment for public paths (`/login`, `/refresh`)
- All other requests get `Authorization: Bearer <token>`
- Current interceptor already attaches the token but doesn't skip public paths — fix this

### 4. Inbound 401 Interception & RxJS Refresh Queue

This is the core RxJS challenge. In the interceptor, catch `HttpErrorResponse`:

- If status is **401 Unauthorized**:
  - Maintain a private `isRefreshing = false` flag and a `BehaviorSubject<string | null>(null)` queue
  - **If not currently refreshing** (`isRefreshing === false`):
    - Set `isRefreshing = true`
    - Reset the subject to `null`
    - Call the token refresh endpoint
    - On success: update the token in `LoginService`, emit the new token on the subject, set `isRefreshing = false`, and **replay the original failed request** with the new token
  - **If currently refreshing** (`isRefreshing === true`):
    - Pipe the `BehaviorSubject` → `filter(token => token !== null)` → `take(1)` → `switchMap` to clone the failed request with the new token and retry it
    - This queues all concurrent 401'd requests until the single refresh completes
  - **If the refresh itself fails with 401**: clear all tokens, navigate to `/login`, reject queued requests

### 5. Mock Refresh Endpoint

- The current mock API (dummyjson.com) supports `/auth/refresh` — use it
- If it doesn't fit, add a `REFRESH_URL` injection token alongside `AUTH_URL`

---

## Phase 3: Advanced Route Patterns

Modern Angular routing goes beyond guards and interceptors. This phase upgrades the project with lazy loading, resolvers, conditional route matching, deactivation guards, dynamic redirects, and return-URL handling — the patterns that separate a junior route config from a production one.

### Prerequisite: Remove ChangeDetectionStrategy.Eager

All existing components explicitly set `ChangeDetectionStrategy.Eager`. In Angular v22, standalone components default to OnPush when no strategy is specified. Remove the explicit `changeDetection` line from every component before starting Phase 3.

### 1. Lazy Loading All Feature Routes

Every route currently uses `component:` with a static import at the top of `app.routes.ts`. This means the entire app loads in a single JS bundle — every component is downloaded upfront, even if the user never visits that route.

Switch every route to `loadComponent:` with a dynamic `import()` call. The bundler creates a separate chunk per lazy component, downloaded only when the route is first navigated to. The only eagerly-loaded component should be the app shell (`App`) — it holds the `<router-outlet>` and must be present immediately.

After this change, no component should be imported at the top of `app.routes.ts`. Guards and resolvers are still imported statically (they're small functions, not UI chunks).

**Feature areas with `loadChildren`:** The project has natural groupings — an auth area (`/login`, `/register`) and a protected area (`/dashboard`, `/admin`, `/profile`). Instead of listing every route flat in `app.routes.ts`, group related routes into their own route config files and load them with `loadChildren`. This lazy-loads the entire feature's route config — the router doesn't even parse those child routes until the user navigates into that area.

`app.routes.ts` becomes a high-level map: the root redirect, a `loadChildren` entry for the auth area, a `loadChildren` entry for the protected area, and standalone routes like `/forbidden`. Each feature area gets its own routes file (e.g., `auth/auth.routes.ts`, `protected/protected.routes.ts`) that defines the child routes with `loadComponent` for each component within.

This is the structure real production apps use — flat route files don't scale past a handful of routes. `loadChildren` gives you route-level code splitting at the feature boundary, not just the component boundary.

**Verify:** Open the browser DevTools Network tab. Navigate between routes. Each route should trigger a new JS chunk download on first visit. Subsequent visits to the same route should not re-download.

**Interview relevance:** "How do you optimize initial bundle size in Angular?" — lazy loading routes is the first answer. Know the difference between `loadComponent` (single component) and `loadChildren` (child route config). Know when to use which: `loadComponent` for isolated pages, `loadChildren` for feature areas with multiple related routes.

### 2. RedirectFunction for the Root Path

The `''` path currently renders the `Home` component. Replace it with a `RedirectFunction` — a function that runs in an injection context and returns a `UrlTree` or a string path to redirect to.

The function should `inject()` the `LoginService` and check authentication state. If the user is authenticated, redirect to `/dashboard`. If not, redirect to `/login`. This eliminates the need for a separate Home component — the root path becomes a smart entry point.

A `RedirectFunction` receives a `RedirectCommand` argument (which contains the matched route info) and can call `inject()` because it runs inside Angular's injection context. This is the v18+ replacement for hardcoded `redirectTo: '/somewhere'` strings.

Remove the `Home` component and its route entry entirely. Clean up the nav links in the app shell.

**Interview relevance:** "How do you handle conditional redirects at the route level?" — most candidates only know static `redirectTo` strings. Knowing `RedirectFunction` shows awareness of modern router APIs.

### 3. Resolvers + withComponentInputBinding

A `ResolveFn<T>` is a function the router executes during navigation, after guards pass but before the component is created. It prefetches data so the component always boots with data available — no loading state, no `undefined` checks.

**Router configuration:** Add `withComponentInputBinding()` as a feature to `provideRouter()` in `app.config.ts`. This tells the router to automatically bind route data (resolved values, path params, query params, static data) to component `input()` signals by matching key names. With this enabled, components no longer need to inject `ActivatedRoute` to read route data.

**Resolver:** Create a `ResolveFn<User>` (or whatever the profile response type is) that calls `https://dummyjson.com/auth/me` using `inject(HttpClient)`. Add a `PROFILE_URL` injection token alongside the existing `AUTH_URL` and `KEY` tokens. Attach this resolver to the dashboard route via the `resolve` property — the key name in the `resolve` object must match the `input()` property name on the component.

**Component:** The dashboard component declares an `input()` with the same name as the resolve key. When the route activates, the resolved data flows in automatically. No constructor logic, no `ngOnInit` fetch, no `ActivatedRoute` injection.

**How it works internally:** The router calls the resolver function, waits for the returned Observable/Promise to complete, then passes the result as route data. `withComponentInputBinding` reads the route data keys and matches them to `input()` signals on the routed component. If a key matches, the value is set. Resolved data has the highest precedence — it overrides path params, query params, and static `data` if the names collide.

**Interview relevance:** "How do you access route data in modern Angular?" — the answer is `withComponentInputBinding` + `input()`, not `ActivatedRoute.paramMap.subscribe()`. Resolvers answer "How do you prefetch data before a route loads?"

### 4. CanMatch — Role-Based Route Branching

`canMatch` is fundamentally different from `canActivate`. A `canActivate` guard decides whether navigation is **allowed** — if it returns `false`, navigation fails. A `canMatch` guard decides whether a route entry **matches at all** — if it returns `false`, the router skips that entry and tries the next one in the config array.

This enables a pattern where the same URL path has multiple route entries, each loading a different component based on a condition. The router tries them in order; the first one whose `canMatch` returns `true` wins.

**Task:** Define two route entries for `path: 'dashboard'`:
- The first entry has a `canMatch` guard that checks if the user's role is `'admin'`. If true, it loads an `AdminDashboard` component.
- The second entry has no `canMatch` (or always returns true) and loads a `UserDashboard` component. This is the fallback.

Create a higher-order `CanMatchFn` factory (similar to the existing `roleGuard` pattern) that takes a role string and returns a `CanMatchFn`. Inside, it `inject()`s `LoginService` and compares the user's role.

`AdminDashboard` should display admin-specific content — attach a second resolver that fetches `https://dummyjson.com/users` (the user list). `UserDashboard` displays the authenticated user's profile from the existing profile resolver.

Both components receive their data via `input()` (thanks to `withComponentInputBinding` from step 3). Both use `loadComponent` (thanks to step 1).

**Route order matters.** The admin entry must come first. If the fallback entry is listed first, it always matches and the admin entry is never reached.

**Real-world uses:** Feature flags (show new UI to beta users, old UI to everyone else), A/B testing, subscription tiers, role-based dashboards — all without `@if` blocks in a single component checking roles.

**Interview relevance:** "How do you show different UIs for different roles on the same URL?" — most candidates reach for `*ngIf` or `@if` inside one component. `canMatch` is the architectural answer that keeps components focused.

### 5. CanDeactivate — Unsaved Changes Guard

A `CanDeactivateFn<T>` guard runs when the user tries to navigate **away** from a route. It receives the current component instance as its first argument, so it can read the component's state directly.

**Task:** Create a `Profile` component with a form (name, email, bio — fields can be prefilled with resolved user data or hardcoded defaults). Track dirty state with a signal — either a `computed()` that compares current form value to the original, or a simpler `hasUnsavedChanges` signal that's set on form value changes.

Create a `CanDeactivateFn<Profile>` guard. It receives the `Profile` component instance, reads the dirty signal directly (`component.hasUnsavedChanges()`), and if dirty, shows a `window.confirm()` dialog asking the user to confirm navigation. If the user cancels, the guard returns `false` and navigation is blocked.

The guard doesn't need an interface or abstract class. It accesses the signal property by name on the component instance. The generic type parameter `<Profile>` gives TypeScript the type of the component.

Add a `/profile` route with `canActivate: [authGuard]` and `canDeactivate: [unsavedChangesGuard]`. Add a nav link for Profile in the app shell.

**Interview relevance:** "How do you prevent data loss when a user navigates away from a form?" — this is the most common guard interview question. The signal-based approach (reading `component.hasUnsavedChanges()`) is the modern v22 pattern.

### 6. Return URL After Login

When the `authGuard` blocks navigation and redirects to `/login`, the user loses context — after logging in, they always land on `/dashboard` instead of the page they originally tried to reach.

**Task:** In the `authGuard`, before redirecting to `/login`, store the attempted URL (`state.url` from the `RouterStateSnapshot` argument) somewhere accessible. The simplest v22 approach: add a `returnUrl` signal on `LoginService` (e.g., `signal<string | null>(null)`).

In the `Login` component, after successful login, check if `loginService.returnUrl()` has a value. If so, navigate to that URL instead of the hardcoded `'/dashboard'`. After navigating, clear the return URL signal so it doesn't persist across future logins.

**Edge case:** If the return URL is `/login` itself (the user navigated directly to login, then logged in), ignore it and fall back to `/dashboard`.

**Interview relevance:** "What happens after login in your app?" — without return-URL handling, the answer is "the user always goes to dashboard, even if they were trying to reach /admin." That's a UX gap interviewers notice.

### Target File Structure After Phase 3

```
src/app/
├── app.config.ts                         ← add withComponentInputBinding()
├── app.routes.ts                         ← high-level map: redirect, loadChildren, /forbidden
├── app.ts                                ← update nav links (remove Home, add Profile)
├── tokens/
│   └── tokens.ts                         ← add PROFILE_URL, USERS_URL tokens
├── services/
│   └── login.service.ts                  ← add returnUrl signal
├── guards/
│   ├── auth-guard.ts                     ← store state.url before redirect
│   ├── role-guard.ts                     ← unchanged
│   ├── unsaved-changes-guard.ts          ← NEW: CanDeactivateFn
│   └── dashboard-match-guard.ts          ← NEW: CanMatchFn
├── resolvers/
│   ├── profile-resolver.ts              ← NEW: ResolveFn — fetches /auth/me
│   └── users-resolver.ts               ← NEW: ResolveFn — fetches /users (admin)
├── auth/
│   ├── auth.routes.ts                   ← NEW: child routes for /login, /register
│   ├── login/                            ← read returnUrl after login
│   └── register/                         ← unchanged
├── protected/
│   ├── protected.routes.ts              ← NEW: child routes for /dashboard, /admin, /profile
│   ├── profile/                          ← NEW: form with dirty tracking
│   ├── admin-dashboard/                  ← NEW: admin variant, receives resolved users
│   ├── user-dashboard/                   ← NEW: user variant, receives resolved profile
│   └── admin/                            ← unchanged
├── components/
│   └── forbidden/                        ← unchanged (standalone, not part of a feature area)
```

---

## Acceptance Criteria

### Already Done (Phase 1)

- [x] Auth token attached to outbound requests
- [x] `authGuard` redirects to `/login` if not authenticated
- [x] `roleGuard` checks user role
- [x] Forbidden page for unauthorized access
- [x] Routes configured with guards

### Phase 2 — JWT & Refresh

- [ ] `JwtPayload` interface defined with `exp` and `role`
- [ ] JWT decoded client-side via `atob()` + `JSON.parse()` in a private helper
- [ ] `isAuthenticated` is a computed signal based on token expiration — not a raw string check
- [ ] `userRole` is a computed signal from decoded JWT — no hardcoded toggle
- [ ] `authGuard` reads `isAuthenticated()` signal
- [ ] `roleGuard` reads `userRole()` signal
- [ ] Interceptor skips token for public paths (`/login`, `/refresh`)
- [ ] Interceptor catches 401 and triggers silent refresh
- [ ] Concurrent 401'd requests are queued via `BehaviorSubject` + `filter` + `take(1)`
- [ ] Only one refresh request fires at a time (`isRefreshing` lock)
- [ ] Queued requests replay with the new token after refresh succeeds
- [ ] Failed refresh clears tokens, navigates to `/login`, rejects queued requests
- [ ] No `any` types anywhere

### Phase 3 — Route Patterns

**Lazy Loading:**
- [ ] Feature areas grouped under `loadChildren` with separate route config files (`auth.routes.ts`, `protected.routes.ts`)
- [ ] Individual components within feature areas use `loadComponent`
- [ ] No component imports at the top of `app.routes.ts`
- [ ] App shell (`App`) is the only eagerly-loaded component
- [ ] Network tab confirms separate JS chunks load per route on first visit

**RedirectFunction:**
- [ ] The `''` path uses a `RedirectFunction`, not a static `redirectTo` string
- [ ] `/` redirects to `/dashboard` when authenticated
- [ ] `/` redirects to `/login` when not authenticated
- [ ] `Home` component removed — no orphan files

**Resolvers + withComponentInputBinding:**
- [ ] `withComponentInputBinding()` added to `provideRouter` in `app.config.ts`
- [ ] `ResolveFn` fetches user profile from `dummyjson.com/auth/me`
- [ ] `PROFILE_URL` injection token created alongside existing tokens
- [ ] Dashboard component receives resolved data via `input()` — no `ActivatedRoute` injection
- [ ] Navigation to the resolved route shows prefetched data immediately (no loading state in component)

**CanMatch — Role-Based Branching:**
- [ ] Two route entries exist for `path: 'dashboard'`, each with a different `loadComponent`
- [ ] `CanMatchFn` guard determines which dashboard loads based on user role
- [ ] Admin entry is listed before the fallback entry in the route config
- [ ] Admins see `AdminDashboard` with a resolved user list from `/users`
- [ ] Non-admin users see `UserDashboard` with their resolved profile

**CanDeactivate — Unsaved Changes:**
- [ ] `Profile` component exists with a form that tracks dirty state via a signal
- [ ] `CanDeactivateFn<Profile>` guard reads the component's signal directly
- [ ] Navigating away from a dirty form shows a browser confirmation dialog
- [ ] Navigating away from a clean form proceeds without interruption
- [ ] `/profile` route has both `authGuard` and `unsavedChangesGuard`

**Return URL:**
- [ ] `authGuard` stores `state.url` before redirecting to `/login`
- [ ] After login, user navigates to the originally attempted URL
- [ ] Return URL is cleared after consumption (no stale redirect on next login)
- [ ] If no return URL is stored (or it's `/login`), login falls back to `/dashboard`

- [ ] No `any` types anywhere in Phase 3 code

---

## Key RxJS Operators for the Refresh Queue

- `catchError` — intercept the 401 in the response stream
- `switchMap` — swap to the refresh call, then replay the original request
- `BehaviorSubject` — acts as the queue; concurrent requests subscribe and wait
- `filter` — skip the initial `null` emission
- `take(1)` — each queued request only needs the first real token
- `throwError` — reject queued requests if refresh fails

---

## Testing Strategy

**LoginService:**
- Decodes a known JWT and extracts `exp` and `role` correctly
- `isAuthenticated()` returns `false` when token is expired
- `userRole()` returns the role from the JWT payload
- `logout()` clears token and resets signals

**Interceptor:**
- Skips auth header for `/login` and `/refresh`
- Attaches `Bearer` token for other requests
- On 401: triggers refresh, retries original request with new token
- On concurrent 401s: only one refresh call fires; all requests get retried
- On refresh failure: clears state and navigates to `/login`

**Guards (Phase 2):**
- `authGuard` returns `true` when `isAuthenticated()` is `true`
- `authGuard` redirects to `/login` when `isAuthenticated()` is `false`
- `roleGuard('admin')` allows when `userRole()` is `'admin'`
- `roleGuard('admin')` redirects to `/forbidden` when role doesn't match

**Resolvers (Phase 3):**
- Profile resolver returns user data when called with a valid token
- Profile resolver handles error (e.g., expired token) gracefully
- Admin users resolver returns a user list

**CanMatch Guard (Phase 3):**
- `dashboardMatchGuard('admin')` returns `true` when user role is `'admin'`
- `dashboardMatchGuard('admin')` returns `false` when user role is not `'admin'`
- Route config with two `'dashboard'` entries routes to the correct component based on role

**Unsaved Changes Guard (Phase 3):**
- `unsavedChangesGuard` returns `true` when `hasUnsavedChanges()` is `false`
- `unsavedChangesGuard` prompts the user when `hasUnsavedChanges()` is `true`
- Returns `false` (blocks navigation) when user cancels the prompt

**Return URL (Phase 3):**
- `authGuard` stores `state.url` on `LoginService.returnUrl` before redirecting
- `Login` navigates to the return URL after successful login
- Return URL is cleared after navigation
- `/login` is not stored as a return URL

**Profile Component (Phase 3):**
- Form renders with expected fields
- `hasUnsavedChanges` signal reflects dirty state accurately
- Signal resets when form is saved or reset

---

## Resources

- [Angular HTTP Interceptors Guide](https://angular.dev/guide/http/interceptors)
- [Angular Route Guards](https://angular.dev/guide/routing/route-guards)
- [JWT.io](https://jwt.io/)
- [DummyJSON Auth API](https://dummyjson.com/docs/auth)
- [DummyJSON Users API](https://dummyjson.com/docs/users)
- [Route Data Resolvers](https://angular.dev/guide/routing/data-resolvers)
- [withComponentInputBinding](https://angular.dev/api/router/withComponentInputBinding)
- [Route Loading Strategies (loadComponent)](https://angular.dev/guide/routing/loading-strategies)
- [CanMatchFn](https://angular.dev/api/router/CanMatch)
- [CanDeactivateFn](https://angular.dev/api/router/CanDeactivateFn)
- [RedirectFunction](https://angular.dev/api/router/RedirectFunction)
- [Customizing Route Behavior](https://angular.dev/guide/routing/customizing-route-behavior)

---

## Notes

- `atob()` + `JSON.parse()` is intentionally used instead of a library like `jose` — this is a learning challenge, not production code. In interviews, mention the tradeoff: no signature verification client-side, which is fine because the server validates the signature on every request anyway.
- The `BehaviorSubject` refresh queue pattern is a common interview question — understand why `filter` + `take(1)` is needed (skip the initial `null`, take only the first real token, then complete).
- `canMatch` vs `canActivate` — know the difference cold. `canActivate` blocks navigation (the user sees an error or redirect). `canMatch` skips the route entry silently and the router tries the next match. Different tools for different problems.
- `withComponentInputBinding` has a precedence order: resolved data > path params > query params > static `data`. If a resolver key and a path param have the same name, the resolved value wins.
- The `CanDeactivateFn` generic type parameter (`<Profile>`) is what gives you typed access to the component instance. Without it, you'd need to cast or access properties via `any`.
- `RedirectFunction` runs in an injection context — you can `inject()` services inside it. This is the same pattern as functional guards and resolvers. Angular v18+ made the router fully functional.
