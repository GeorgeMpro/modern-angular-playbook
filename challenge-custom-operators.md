# Challenge: Custom RxJS Operators

**Difficulty:** Medium-Hard  
**Time Estimate:** 3-4 hours  
**Focus:** Building real pipeable operators from scratch

---

## Context

You already built `callTimer<T>` — a pipeable operator using `defer` + `finalize`.
That's the pattern. Now build 5 more.

Each operator must:
- Be a **pipeable operator** — works inside `.pipe()`
- Be **generic** — preserves the `Observable<T>` type
- Clean up after itself — no leaks

---

## The 5 Operators

---

### Operator 1: `retryWithBackoff<T>`

**What it does:**  
Retries a failed observable with exponential backoff delay. After each failure, wait longer before retrying. After max retries, throw the error.

**Signature:**
```ts
retryWithBackoff<T>(maxRetries: number, baseDelayMs: number): OperatorFunction<T, T>
```

**Behavior:**
- Retry 1 → wait `baseDelayMs * 1`
- Retry 2 → wait `baseDelayMs * 2`
- Retry 3 → wait `baseDelayMs * 4`
- After `maxRetries` attempts → throw the original error
- **Do NOT retry 4xx HTTP errors** — only retry network errors (status 0) and 5xx

**Usage:**
```ts
this.http.get('/api/data').pipe(
  retryWithBackoff(3, 1000)
).subscribe();
```

**Hint:** `retry({ count, delay })` or `retryWhen` + `mergeMap` + `timer`

---

### Operator 2: `withLoading<T>`

**What it does:**  
Sets an Angular signal to `true` when the stream starts and `false` when it completes, errors, or is unsubscribed.

**Signature:**
```ts
withLoading<T>(loadingSignal: WritableSignal<boolean>): OperatorFunction<T, T>
```

**Behavior:**
- On subscribe → `loadingSignal.set(true)`
- On finalize (complete/error/unsubscribe) → `loadingSignal.set(false)`
- Does NOT modify the emitted values

**Usage:**
```ts
readonly isLoading = signal(false);

this.http.get('/api/users').pipe(
  withLoading(this.isLoading)
).subscribe();
```

**Hint:** `defer` + `finalize`. Think about WHY `defer` is needed here.

---

### Operator 3: `tapOnce<T>`

**What it does:**  
Like `tap`, but the side effect only runs on the **first emission**. All subsequent emissions pass through untouched.

**Signature:**
```ts
tapOnce<T>(fn: (value: T) => void): OperatorFunction<T, T>
```

**Behavior:**
- First value → run `fn(value)`, then emit it
- All other values → emit them, skip `fn`
- Does NOT modify emitted values

**Usage:**
```ts
this.searchResults$.pipe(
  tapOnce(results => this.logFirstSearchEvent(results))
).subscribe();
```

**Hint:** You need to track whether the first emission has happened. Think `scan` or a closure variable. Remember: each subscription should get its own "has fired" state — that's what `defer` is for.

---

### Operator 4: `cacheFor<T>`

**What it does:**  
Caches the observable result for a given TTL (time-to-live in ms). If re-subscribed within the TTL, returns the cached result. After TTL expires, next subscription re-executes the source.

**Signature:**
```ts
cacheFor<T>(ttlMs: number): OperatorFunction<T, T>
```

**Behavior:**
- First subscription → executes source, caches result
- Re-subscribe within TTL → returns cached result instantly (no re-fetch)
- Re-subscribe after TTL → executes source again, refreshes cache
- Multiple concurrent subscriptions → all share the same execution (no duplicate requests)

**Usage:**
```ts
this.http.get<Config>('/api/config').pipe(
  cacheFor(5 * 60 * 1000) // cache for 5 minutes
).subscribe();
```

**Hint:** `shareReplay({ bufferSize: 1, refCount: false })` + `timer` to invalidate. You'll need to hold a reference outside the operator function and reset it after TTL.

---

### Operator 5: `auditTrail<T>`

**What it does:**  
Records every emission into a log array (with timestamp and label), and optionally pushes to a provided signal. The values pass through unchanged.

**Signature:**
```ts
auditTrail<T>(
  label: string,
  store?: WritableSignal<AuditEntry<T>[]>
): OperatorFunction<T, T>

interface AuditEntry<T> {
  label: string;
  value: T;
  timestamp: string; // ISO string
}
```

**Behavior:**
- Every emission → create an `AuditEntry`, push to internal log
- If `store` signal is provided → update it with the full log
- On complete → log `[AuditTrail] ${label}: stream completed (${count} events)`
- Does NOT modify emitted values

**Usage:**
```ts
this.authService.tokenRefresh$.pipe(
  auditTrail('token-refresh', this.auditLog)
).subscribe();
```

**Hint:** `tap` + `finalize`. Use `scan` or a closure array to accumulate entries. Think about when to update the signal — on every emission or only at the end?

---

## Acceptance Criteria

### Each operator must:
- [ ] Be a standalone function in its own file (`retry-with-backoff.operator.ts`, etc.)
- [ ] Export a named function
- [ ] Be fully typed with generics — no `any`
- [ ] Work correctly inside `.pipe()`
- [ ] Not leak subscriptions or references

### Integration test:
Build a single `demo.component.ts` that uses **all 5 operators together** in one pipe:

```ts
this.http.get<SecurityEvent[]>('/api/security/events').pipe(
  retryWithBackoff(3, 500),
  cacheFor(30_000),
  withLoading(this.isLoading),
  tapOnce(events => console.log('First batch received:', events.length)),
  auditTrail('security-events', this.auditLog)
).subscribe(events => this.events.set(events));
```

---

## Structure

```
src/app/operators/
├── retry-with-backoff.operator.ts
├── with-loading.operator.ts
├── tap-once.operator.ts
├── cache-for.operator.ts
├── audit-trail.operator.ts
└── index.ts  (re-export all)

src/app/demo/
└── demo.component.ts  (uses all 5 together)
```

---

## Key Concepts to Know Cold

| Concept | Used in |
|---|---|
| `defer()` | withLoading, tapOnce — per-subscription setup |
| `finalize()` | withLoading, auditTrail, callTimer |
| `retry({ delay })` | retryWithBackoff |
| `timer()` | retryWithBackoff backoff delay |
| `shareReplay()` | cacheFor |
| `tap()` | auditTrail, tapOnce |
| closure variables | tapOnce, cacheFor — state across emissions |

---

## Why These Matter for Appdome

| Operator | Appdome relevance |
|---|---|
| `retryWithBackoff` | Resilient API calls for security monitoring services |
| `withLoading` | UX during security scans / threat detection requests |
| `tapOnce` | One-time analytics / initialization events |
| `cacheFor` | Avoid hammering security config / policy APIs |
| `auditTrail` | Security audit log — who did what and when |

---

**You already know the pattern. `defer` + `finalize` + a closure. Now scale it.**
