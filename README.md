# Angular Challenges

A collection of hands-on Angular challenges built to master modern framework patterns — signals, RxJS, interceptors, error handling, performance, accessibility, and more. Each challenge is a self-contained Angular workspace project with a corresponding `.md` file covering the requirements and implementation details.

---

## Contents

- [Challenge 11 — Centralized Error Handling](#challenge-11--centralized-error-handling)
- [Challenge 12 — Reactive Design Patterns](#challenge-12--reactive-design-patterns)
- [Custom RxJS Operators](#custom-rxjs-operators)

---

## Challenge 11 — Centralized Error Handling

**Focus:** GlobalErrorHandler, HTTP interceptors, toast notifications, custom RxJS operators

**Project:** `challenge-11-centralized-error-handling`  
**Live:** https://modern-angular-ch11.web.app

```bash
ng serve challenge-11-centralized-error-handling
```

### What's inside

- **`GlobalErrorHandler`** — implements Angular's `ErrorHandler` to catch all uncaught JS errors app-wide; logs via `ErrorLogger` and surfaces a toast notification
- **`errorInterceptor`** — functional HTTP interceptor that maps status codes to user-friendly messages and delegates network/5xx errors to `retryOnNetworkError`
- **`mockBackendInterceptor`** — simulates HTTP error responses (400, 401, 403, 404, 500, network failure) without a real server; includes a flaky endpoint for retry testing
- **`ToastService`** — signal-based toast queue with auto-dismiss timers, status-driven action mapping (retry/undo/dismiss), and a `Map`-backed timer registry for clean cancellation
- **`ErrorLogger`** — structured `console.error` logging with full error context (source, HTTP status, URL, method, stack trace)
- **`retryOnNetworkError<T>`** — pipeable operator with exponential backoff (`2^n` seconds), skips 4xx errors, fires an optional `onRetry` progress callback
- **`trackRequest<T>`** — pipeable operator using `defer` + `finalize` to set a `WritableSignal<boolean>` for the full request lifecycle including cancellation
- **`ErrorTest` component** — interactive trigger panel; uses `exhaustMap` to prevent concurrent requests and `takeUntil` for cancellation

---

## Challenge 12 — Reactive Design Patterns

**Focus:** Advanced RxJS orchestration patterns implemented as eight standalone, production-grade challenges

**Project:** `challenge-12-rxjs-patterns`  
**Live:** https://modern-angular-ch12.web.app

```bash
ng serve challenge-12-rxjs-patterns
```

### Challenges

| # | Name | Pattern | Key Operators |
|---|------|---------|---------------|
| 01 | Parallel Batcher | Concurrency control | `mergeMap`, `toArray` |
| 02 | Recursive Crawler | Recursive stream expansion | `expand`, `takeWhile` |
| 03 | Stream Multiplexer | Polymorphic stream dispatch | `groupBy`, `bufferTime` |
| 04 | Async Accumulator | Race-condition-free state | `mergeScan`, `scan` |
| 05 | Stream Splitter | Source multicasting | `partition` |
| 06 | High-Pressure Smoother | Backpressure management | `bufferTime`, `auditTime` |
| 07 | Signal Bridge | Angular Signals ↔ RxJS interop | `toObservable`, `toSignal`, `switchMap` |
| 08 | Form Guard | Submission guarding + resilient retry | `exhaustMap`, `defer`, `retry` |

### Shared infrastructure

- **`retryWithBackoff<T>`** — generic operator with configurable max retries, base delay, and optional `onRetry` callback
- **`withLoading`** — operator that wraps a source with loading signal management via `defer` + `finalize`
- **`TableAction<T>`** — Command Pattern interface (`label` + `callback`) for decoupled table actions
- **`MockApiService`** — backend contract layer (do not modify); all challenges depend on it as an injection token

---

## Custom RxJS Operators

**Project:** `challenge-custom-rxjs`  
**Type:** Pipeable operator library — no visual demo. Source: `src/rxjs-operators/operators.ts`

A set of generic, reusable pipeable operators built from first principles using `defer`, `finalize`, `retry`, and `tap`.

| Operator | Signature | What it does |
|---|---|---|
| `callTimer<T>` | `(label, callback?)` | Measures stream execution time via `defer` + `finalize`; fires optional callback with elapsed ms |
| `retryWithBackoff<T>` | `(maxRetries, baseDelayMs)` | Exponential backoff retry; skips 4xx HTTP errors, only retries network and 5xx |
| `withLoading<T>` | `(signal)` | Sets a `WritableSignal<boolean>` true on subscribe, false on finalize — covers complete, error, and unsubscribe |
| `tapOnce<T>` | `(fn)` | Runs a side effect on the first emission only; uses `defer` closure so each subscription gets its own "has fired" state |
