# Angular Challenges

A collection of hands-on Angular 22 challenges built to master modern framework patterns — signals, RxJS, interceptors, error handling, performance, accessibility, and more. Each challenge is a self-contained Angular workspace project with a corresponding `.md` file covering the requirements and implementation details.

---

## Contents

- [Challenge 08 — Custom Directives](#challenge-08--custom-directives)
- [Challenge 11 — Centralized Error Handling](#challenge-11--centralized-error-handling)
- [Challenge 12 — Reactive Design Patterns](#challenge-12--reactive-design-patterns)
- [Custom RxJS Operators](#custom-rxjs-operators)
- [Challenge — Template Composition](#challenge--template-composition)

---

## Challenge 08 — Custom Directives

**Focus:** Attribute and structural directives — DOM APIs, `ViewContainerRef`/`TemplateRef`, generic type narrowing, host bindings

**Project:** `challenge-08-custom-directives`
**Live:** https://modern-angular-ch-directives.web.app

```bash
ng serve challenge-08-custom-directives
```

### Directives

| # | Name | Concept | State |
|---|------|---------|-------|
| 01 | `appLazyLoad` | IntersectionObserver, lazy image loading | Done |
| 02 | `appDebounceClick` | `outputFromObservable`, `Subject`, `debounce` | Done |
| 03 | `appInfiniteScroll` | `throttleTime`, `afterNextRender`, reactive `BehaviorSubject` state | Done |
| 04 | `appClickOutside` | `document` event listener, `ElementRef` | Done |
| 05 | `appCopyToClipboard` | Clipboard API, async output | Done |
| 06 | `appTooltip` | Renderer2, dynamic element creation, positioning | Done |
| 07 | `appAutoFocus` | `afterNextRender`, `ElementRef`, `hostDirectives` composition with `FocusStatus` | Done |
| 08 | `appHighlight` | `effect()`, computed font contrast, `host` style bindings | Done |
| 09 | `appPermission` | Structural directive, `ViewContainerRef`, `TemplateRef`, `InjectionToken` | Done |
| 10 | `appTrapFocus` | Keyboard event handling, `querySelectorAll`, focus management | Done |
| 11 | `appLongPress` | `fromEvent`, `switchMap`, `timer`, touch + mouse events | Done |
| 12 | `appAnimateOnScroll` | IntersectionObserver, CSS class toggle, fire-once vs repeat | Done |
| 13 | `appNumbersOnly` | Keyboard event filtering, clipboard paste interception | Done |
| 14 | `appResizeObserver` | ResizeObserver API, element-level size tracking | Done |
| 16 | `appTypedIf` | `ngTemplateGuard_*`, `ngTemplateContextGuard`, generic structural directive, compile-time type narrowing | Done |
| 17 | `appAsync` | `ngTemplateContextGuard`, generic `Observable<T>` structural directive, loading/error state | Done |
| 18 | `appExitConfirm` | `beforeunload`, `window` host listener, `CanDeactivate` complement | Done |

Directive 15 (`hostDirectives` composition) was cut — redundant with #07's `AutoFocus`/`FocusStatus` composition, same technique with no new demo value.

---

## Challenge 11 — Centralized Error Handling

**Focus:** GlobalErrorHandler, HTTP interceptors, toast notifications, custom RxJS operators

**Project:** `challenge-11-centralized-error-handling`  
**Live:** https://modern-angular-ch11.web.app

```bash
ng serve challenge-11-centralized-error-handling
```

### Challenges

| Name | What it does |
|------|-------------|
| `GlobalErrorHandler` | Implements Angular's `ErrorHandler` to catch all uncaught JS errors app-wide; logs via `ErrorLogger` and surfaces a toast notification |
| `errorInterceptor` | Functional HTTP interceptor that maps status codes to user-friendly messages; delegates network/5xx errors to `retryOnNetworkError` |
| `mockBackendInterceptor` | Simulates HTTP error responses (400, 401, 403, 404, 500, network failure) without a real server; includes a flaky endpoint for retry testing |
| `ToastService` | Signal-based toast queue with auto-dismiss timers, status-driven action mapping (retry/undo/dismiss), and a `Map`-backed timer registry for clean cancellation |
| `ErrorLogger` | Structured `console.error` logging with full error context (source, HTTP status, URL, method, stack trace) |
| `retryOnNetworkError<T>` | Pipeable operator with exponential backoff (`2^n` seconds), skips 4xx errors, fires an optional `onRetry` progress callback |
| `trackRequest<T>` | Pipeable operator using `defer` + `finalize` to set a `WritableSignal<boolean>` for the full request lifecycle including cancellation |
| `ErrorTest` | Interactive trigger panel; uses `exhaustMap` to prevent concurrent requests and `takeUntil` for cancellation |

---

## Challenge 12 — Reactive Design Patterns

**Focus:** Advanced RxJS orchestration patterns implemented as eleven standalone, production-grade challenges

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
| 09 | Dashboard Filter | Multi-source reactive filtering + ViewModel | `combineLatest`, `switchMap`, `debounceTime` |
| 10 | Save Queue | Sequential queue orchestration + Command dispatch | `concatMap`, `Subject`, `signal` |
| 11 | Window Processor | Live window analytics + rolling history | `windowTime`, `mergeMap`, `reduce`, `scan` |

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

---

## Challenge — Template Composition

**Goal:** Build reusable, type-safe Angular component architecture without coupling layout to business logic.

**Focus:** Template composition, content projection, dynamic rendering, generic components, recursive templates, injector scope

**Project:** `challenges-ng-template`  
**Live:** https://modern-angular-ch-ng-template.web.app

```bash
ng serve challenges-ng-template
```

### Challenges

| # | Name | Key Concepts | State |
|---|------|-------------|-------|
| 01 | Composable Panel | `ng-content`, named slots, fallback content, `contentChild()` | Done |
| 02 | Configurable Modal | `TemplateRef` as input, reusable shell components | Done |
| 03 | Dynamic Data Table | Generic `<T>`, `ngTemplateOutletContext`, `ngTemplateContextGuard`, typed directive | Done |
| 04 | Dynamic Layout | `viewChild`, `computed()` template selection, decoupled layout shell | Done |
| 05 | Recursive Folder Explorer | Self-referencing `ngTemplateOutlet`, recursive context, depth threading, collapse toggle | Done |
| 06 | Template Injector Scope | `ngTemplateOutletInjector`, creation vs outlet injector, scoped service, directive bridge | Done |
| 07 | Route-Driven Layout | `withComponentInputBinding`, resolvers, `loadComponent`, `CanActivateFn`, `CanDeactivateFn`, named outlets, `@defer` | Done |
