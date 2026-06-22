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

**Guards:**
- `authGuard` returns `true` when `isAuthenticated()` is `true`
- `authGuard` redirects to `/login` when `isAuthenticated()` is `false`
- `roleGuard('admin')` allows when `userRole()` is `'admin'`
- `roleGuard('admin')` redirects to `/forbidden` when role doesn't match

---

## Resources

- [Angular HTTP Interceptors Guide](https://angular.dev/guide/http/interceptors)
- [Angular Route Guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access)
- [JWT.io](https://jwt.io/)
- [DummyJSON Auth API](https://dummyjson.com/docs/auth)

---

## Notes

- `atob()` + `JSON.parse()` is intentionally used instead of a library like `jose` — this is a learning challenge, not production code. In interviews, mention the tradeoff: no signature verification client-side, which is fine because the server validates the signature on every request anyway.
- The `BehaviorSubject` refresh queue pattern is a common interview question — understand why `filter` + `take(1)` is needed (skip the initial `null`, take only the first real token, then complete).
