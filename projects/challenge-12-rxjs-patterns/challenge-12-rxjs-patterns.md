# Challenge #12: Advanced RxJS Patterns

**Difficulty:** Hard  
**Angular Version:** 22+  
**Focus:** Higher-order observables, stream manipulation, and Signal interop

---

## Context

The previous custom-operators challenge was about **building** operators.  
This challenge is about **knowing when and how to use**.

Each pattern here solves a real problem you will hit in production. The mock service simulates real-world conditions: configurable latency, random failures, paginated responses, and a high-frequency event stream.

---

## Project Structure

```
src/app/
├── mock/
│   └── mock-api.service.ts        ← provided, do not modify
├── challenges/
│   ├── 01-parallel-batcher/
│   ├── 02-recursive-crawler/
│   ├── 03-stream-multiplexer/
│   ├── 04-async-accumulator/
│   ├── 05-stream-splitter/
│   ├── 06-high-pressure-smoother/
│   ├── 07-signal-bridge/
│   ├── 08-form-guard/
│   ├── 09-dashboard-filter/
│   ├── 10-save-queue/
│   ├── 11-window-processor/
│   └── 12-subject-selector/
└── app.ts
```

---

## Mock API Contract

The `MockApiService` exposes these methods. **Do not change them.**

```ts
// Returns a list of item IDs (fast, no failure)
getItemIds()
:
Observable<number[]>

// Fetches one item by ID — random ~200-600ms delay, fails if Math.random() > 0.7
getItemDetail(id
:
number
):
Observable<Item>

// Paginated endpoint — returns { data: Item[], nextPage: number | null }
getPage(page
:
number
):
Observable<PageResult>

// Emits a stream of mixed events at ~50ms intervals (simulates WebSocket)
getEventStream()
:
Observable<AppEvent>

// Saves an item — random ~300ms delay, fails if Math.random() > 0.6
saveItem(item
:
Item
):
Observable<SaveResult>
```

Types:

```ts
interface Item {
  id: number;
  name: string;
  category: 'log' | 'warning' | 'error';
}

interface PageResult {
  data: Item[];
  nextPage: number | null;
}

interface AppEvent {
  type: 'log' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface SaveResult {
  id: number;
  success: boolean;
}
```

---

## Challenge 1: The Parallel Batcher

**Operators:** `mergeMap` (with concurrency), `toArray`  
**Data source:** Hybrid — use dummyjson `/products` for real data; wrap `getItemDetail()` calls in the mock service to inject random failures

### The Problem

You have a list of 20 item IDs. You need to fetch the detail for each one. You cannot fire all 20 requests at once (server limit). You want **max 3 concurrent requests** at any time. Once all are done, emit the full array of results.

### Task

Call `getItemIds()`, then fetch each detail in parallel with a max concurrency of 3. Collect all results into a single array and display them.

### Behavior

- Exactly 3 requests active at any given moment
- If a request fails, log the error and continue — do not stop the whole batch
- Final array emits once, containing only the successful results
- Show a loading indicator while in progress

### What you'll learn

`mergeMap(fn, 3)` is not the same as `forkJoin`. `forkJoin` needs the full array upfront and runs everything at once. `mergeMap` with concurrency processes a stream of values with a sliding window — a fundamentally different execution model.

### Hint

`from(ids)` turns the array into a stream. The concurrency argument is the second parameter of `mergeMap`. To collect everything at the end, you need the source to complete first.

---

## Challenge 2: The Recursive Crawler

**Operators:** `expand`, `takeWhile`, `concatMap`, `toArray`  
**Data source:** dummyjson — `/products?limit=10&skip=N` maps directly to a paginated `{ data, nextPage }` shape

### The Problem

`getPage(1)` returns page 1 and tells you what the next page number is (or `null` if done). You need to fetch **every page** until there are no more, then assemble the full list.

### Task

Starting from page 1, recursively fetch all pages. Stop when `nextPage` is `null`. Collect every item across all pages into one flat array.

### Behavior

- Only one page request at a time (no parallel page fetches)
- Works for any number of pages — no hardcoded limit
- Emits the complete item list once all pages are loaded
- Show how many pages were fetched

### What you'll learn

`expand` is the recursive observable. It takes each emission, runs a projection that returns a new observable, and feeds that back into itself. It is the only clean way to express "keep fetching until a condition is met" without a `while` loop or manual state.

### Hint

`expand` emits every intermediate value — including the `PageResult` objects themselves, not just the final one. You need to `takeWhile` before it emits the terminal state, or decide where to put the stop condition. Think carefully about what `expand` actually emits.

---

## Challenge 3: The Stream Multiplexer

**Operators:** `groupBy`, `mergeMap`, `toArray` (inner)  
**Data source:** Mock only — needs a high-frequency event stream with mixed types; dummyjson has nothing equivalent. Use `MockApiService.getEventStream()`

### The Problem

`getEventStream()` emits a mix of `log`, `warning`, and `error` events on one stream. You need to handle each type differently — errors get saved immediately, warnings are batched, logs are counted.

### Task

Take the single event stream and route each event type into its own pipeline:

- `error` events → call `saveItem()` for each immediately
- `warning` events → collect into groups of 3, then log the batch. If a 3rd warning hasn't arrived within 5 seconds of the 1st, flush whatever you have anyway
- `log` events → maintain a running count signal

### Behavior

- All three pipelines run concurrently from one source subscription
- No event type processing should block another
- The warning batch flushes on count (3) OR timeout (5s), whichever comes first
- The component displays live counts for each type

### What you'll learn

`groupBy` creates a `GroupedObservable` per key. The critical part: you **must** subscribe to each inner group via `mergeMap` or they will never execute. Forgetting to handle the inner observable is the most common `groupBy` bug. The timeout requirement forces you to compose operators inside a group — this is where `groupBy` gets genuinely hard.

### Hint

`groupBy` emits `GroupedObservable<key, T>`. Each one has a `.key` property. Use `mergeMap` on the outer stream to get access to each group, then switch on `group.key` to apply different pipelines. For the timeout on warnings, look at `bufferTime` with a count limit, or consider `buffer` with a custom closing notifier.

---

## Challenge 4: The Async State Accumulator

**Operators:** `mergeScan`  
**Data source:** Hybrid — use dummyjson `/products` to seed the item stream; use `MockApiService.saveItem()` for the random-failure save calls

### The Problem

Items arrive one at a time from a stream. For each new item, you need to save it via `saveItem()` and maintain a running list of all successfully saved items. The list must update reactively as each save completes.

### Task

Take a stream of new items (simulate with a button that emits one item per click). For each item, call `saveItem()` and accumulate the results into a growing array that updates the UI after each successful save.

### Behavior

- The displayed list grows by one item each time a save completes
- Failed saves are skipped (logged only), list is unaffected
- Multiple saves can be in flight at the same time
- Show a "saving" count indicator

### What you'll learn

`scan` accumulates synchronously. `mergeScan` is `scan` where the accumulator returns an `Observable` — it waits for that observable to resolve before updating the accumulator. This is the operator for "running total that depends on async work."

Bonus question to answer in a comment: why is `mergeScan` the right choice here over `scan + switchMap`? What would `switchMap` break?

### Hint

`mergeScan(accumulator, seed)` — the accumulator receives `(acc, value)` and must return an `Observable<acc>`. Think about what your accumulator and seed types are before writing a line of code. `mergeScan` is concurrent by default — think about whether that matters for a write operation.

---

## Challenge 5: The Stream Splitter

**Operators:** `partition`  
**Data source:** Mock only — needs the mixed-type event stream. Use `MockApiService.getEventStream()`

### The Problem

`getEventStream()` emits events that are either recoverable (`log`, `warning`) or critical (`error`). You want two completely independent streams to handle them differently — without subscribing to the source twice or using `filter` + `if` inside a `tap`.

### Task

Split the event stream into `normal$` and `critical$`. Display them in two separate lists that update independently.

### Behavior

- One subscription to the source
- `normal$` receives `log` and `warning` events
- `critical$` receives `error` events
- Both lists update live
- Adding a new event type in the future should only require changing the predicate

### What you'll learn

`partition(source, predicate)` returns `[trueStream$, falseStream$]`. It subscribes to the source once and multicasts to both. The alternative — two `filter` calls — creates two subscriptions and runs the source twice. For a WebSocket or expensive stream, that matters.

### Hint

`partition` is not a pipeable operator — it's a creation function. Its signature is `partition(source$, predicate)` not `source$.pipe(partition(...))`.

---

## Challenge 6: The High-Pressure Smoother

**Operators:** `bufferTime`, `auditTime`, `filter`  
**Data source:** Mock only — the high-frequency stream (~20 events/sec) must be simulated. Use `MockApiService.getEventStream()`

### The Problem

`getEventStream()` fires ~20 events per second. Updating the UI on every single emission causes jank. You need to batch events into chunks and update the UI at most once every 500ms.

### Task

Buffer the event stream and emit batches every 500ms. Display the count of events received in each batch and a rolling total. Also implement a separate pipeline that only emits the **most recent** event every 500ms (not a batch — just the latest).

### Behavior

- `bufferTime(500)` pipeline: emits arrays, skips empty windows
- `auditTime(500)` pipeline: emits only the latest value in each window
- Both update a signal that drives the template
- UI never updates faster than 500ms

### What you'll learn

`bufferTime` collects all emissions in a window into an array — good for "process the batch." `auditTime` discards all but the last emission in a window — good for "just show the latest state." They solve different problems and are frequently confused with each other and with `debounceTime`.

### Hint

`bufferTime` emits empty arrays when no events arrive — always `filter(batch => batch.length > 0)`. `auditTime` is like `throttleTime` with trailing-only behavior, and unlike `debounceTime` it does not wait for silence.

---

## Challenge 7: The Signal Bridge

**Operators:** `toSignal`, `toObservable`  
**Data source:** Part A — reuse `MockApiService.getEventStream()`; Part B — dummyjson `/products/search?q=` for real search results

### The Problem

Signals own component state in Angular 21. But the complex pipelines in challenges 1–6 are written in RxJS. You need to know exactly where to draw the boundary — and how to cross it in both directions without creating timing bugs or memory leaks.

### Signal → Observable

You have a search input bound to a signal. When the signal changes, fire an HTTP request using `switchMap`. Use `toObservable` to bridge the signal into a pipeline, then pipe it through `debounceTime(300)` + `switchMap` + `toSignal` to get the result back as a signal.

### Behavior

- No `async` pipe in the template
- No manual `subscribe` / `unsubscribe` in the component
- No memory leaks — verify by destroying the component and confirming streams stop
- The search signal → observable pipeline correctly debounces

### What you'll learn

`toSignal` replaces `async` pipe and handles unsubscription automatically. `toObservable` emits synchronously on the first tick — which means `debounceTime` will suppress the initial emission. Knowing this timing behavior is what separates someone who "uses the interop" from someone who understands it.

### Hint

`toObservable` uses an `effect` internally and emits in a microtask after the signal changes — not synchronously. If your `debounceTime` is eating the first value, check `{ initialValue }` on `toSignal` and whether you need `startWith` on the observable side.

---

## Challenge 8: The Form Guard

**Operators:** `exhaustMap`, `merge`, `scan`
**Data source:** Mock only — `MockApiService.saveItem()`

### The Problem

A "Save Profile" button. The user can click it as fast as they want. You need exactly one save request in flight at any time — new clicks during an active save must be silently ignored, not queued and not cancelling the in-flight request.

### Task

Wire a button click to a `Subject`. Pipe it through `exhaustMap` into `saveItem()`. Display a "Processing..." state while the inner observable is active and the last save result (success/failure) once it resolves.

### Behavior

- Only one save request in flight at any time
- Clicks during an active save are ignored — not queued, not cancelling
- UI shows processing state while active
- UI shows save result (success/failure) after each completion
- A counter shows how many clicks were ignored
- Errors inside `exhaustMap` must not terminate the outer stream

### What you'll learn

`exhaustMap` is the only flatMap operator that protects the server by dropping work at the source. The four operators compared:

| Operator     | Behavior on new emission while busy     |
|--------------|-----------------------------------------|
| `switchMap`  | Cancels current, starts new             |
| `mergeMap`   | Runs both in parallel                   |
| `concatMap`  | Queues new, runs after current finishes |
| `exhaustMap` | Ignores new entirely                    |

"Why not just disable the button?" — disabling is UI-only and can be bypassed. `exhaustMap` is a stream-level guarantee that lives in the data layer.

### Hint

`exhaustMap` has no built-in "busy" flag. To track whether it is active, use the `merge + scan` counter pattern from Challenge 4: emit `+1` when a click reaches the subject, emit `-1` when the inner observable completes, `scan` them into a count. Count > 0 means busy.

For errors: put `catchError` inside the `exhaustMap` projection, not outside it. An error outside would terminate the `Subject` stream.

---

## Challenge 9: The Dashboard Filter

**Operators:** `combineLatest`, `withLatestFrom`, `switchMap`, `debounce`
**Data source:** dummyjson — `/products/search?q=` and `/products/category/{category}`

### The Problem

A product table with two independent controls: a category dropdown and a search text input. The table must re-query the API whenever **either** changes. Neither control should block the other.

### Task

Create two signals — one for the selected category, one for the search text. Bridge both into observables and combine them into a single derived stream that fires an HTTP request whenever either value changes.

### Behavior

- Changing the category immediately re-queries (no debounce needed)
- Changing the search text debounces before re-querying
- Both controls can change independently — neither waits for the other
- The active request is cancelled if either control changes while a request is in flight
- Loading state is shown while the request is in flight

### What you'll learn

`combineLatest([a$, b$])` emits whenever **either** source emits, using the latest value from the other. It requires all sources to have emitted at least once before it fires — use `startWith` or signal initial values to avoid this trap.

`withLatestFrom(b$)` is different: it only emits when the **primary** source emits, sampling the latest value of `b$` at that moment. Use it when one stream drives the query and the other is just context.

### Hint

Think carefully about which operator fits here. If the category changes, you want to re-query — that makes category a primary source. If search text changes, you also want to re-query — that also makes it a primary source. When both are primary, `combineLatest` is the right tool. If only one were primary, `withLatestFrom` would apply.

---

## Challenge 10: The Save Queue

**Operators:** `concatMap`
**Data source:** Mock only — `MockApiService.saveItem()`

### The Problem

The user selects multiple items and queues them for saving. Each save must complete — in order — before the next one starts. No parallel saves, no dropped saves.

### Task

Wire a list of items with individual "Queue Save" buttons to a `Subject`. Pipe the subject through `concatMap` into `saveItem()`. Display a live queue showing pending and completed saves in the order they were submitted.

### Behavior

- Saves execute strictly one at a time, in submission order
- A new save starts only after the previous one completes or errors
- The queue is visible in the UI — pending items are shown while waiting
- A failed save is logged and the queue continues with the next item
- The final list shows every result in order

### What you'll learn

`concatMap` is `mergeMap` with concurrency 1, but it also preserves emission order. Contrast with Challenge 8: `exhaustMap` says "ignore," `concatMap` says "queue." The right choice depends on business intent — for a submit button, ignore; for a save queue, queue.

### Hint

`concatMap` subscribes to one inner observable at a time and waits for it to complete before subscribing to the next. The source emissions are buffered internally — nothing is dropped. This is fundamentally different from `exhaustMap`, which has no buffer.

---

## Challenge 11: The Window Processor

**Operators:** `windowTime`, `mergeMap`, `reduce`
**Data source:** Mock only — `MockApiService.getEventStream()`

### The Problem

`bufferTime` from Challenge 6 collects events into arrays. But what if you need to perform **async work on each event within a window** as it arrives — not after the window closes? You need a window that is itself an Observable, not a snapshot array.

### Task

Take the high-frequency event stream. Use `windowTime` to create 1-second windows. For each window, count only the `error` events inside it and emit that count. Display a live rolling series of "errors per second."

### Behavior

- Each 1-second window is processed as its own stream
- Only `error` type events are counted per window
- The count for each window emits when the window closes
- A rolling history of the last N window counts is displayed
- Empty windows (zero errors) still emit a count of 0

### What you'll learn

`bufferTime` → gives you `T[]` after the window closes. You can only process the snapshot.
`windowTime` → gives you `Observable<T>` for each window, open while the window is live. You can `filter`, `map`, `reduce`, or pipe any operator through it while it streams.

Use `windowTime` when the work inside the window is async or requires operators. Use `bufferTime` when you only need the collected array.

### Hint

`windowTime` emits an `Observable<T>` per window via the outer stream. To process each window, pipe through `mergeMap` and apply your inner pipeline there. The inner observable completes when the window closes — that is when you can use `reduce` or `toArray` to get a final value per window.

---

## Challenge 12: The Subject Selector

**Concepts:** `Subject`, `BehaviorSubject`, `ReplaySubject`, `asObservable()`
**Data source:** None — no HTTP, no mock API. Pure stream mechanics.

### The Problem

You have three different communication scenarios in an app. Currently all three use plain `Subject`. Two of them are wrong — late subscribers miss data they should have received.

### Task

Build three services, each solving a different problem. Pick the correct Subject type for each. In every case, the Subject must be **private** — consumers receive only `asObservable()`.

**Service 1 — Event Bus** (`ClickEventService`)
Broadcasts button click events to any listener. No consumer needs to know about past clicks — only future ones.

**Service 2 — Auth State** (`AuthStateService`)
Holds the current authenticated user (`User | null`). Any component that subscribes — even one mounted after login — must immediately receive the current user without waiting for the next change.

**Service 3 — Notification History** (`NotificationService`)
Emits toast notifications. A notification panel that opens *after* several notifications have fired must display the last 5, not start empty.

### Behavior

- A new subscriber to `ClickEventService` receives nothing until the next click
- A new subscriber to `AuthStateService` immediately receives the current user
- A new subscriber to `NotificationService` immediately receives up to the last 5 notifications
- No consumer can call `.next()` on any Subject — `asObservable()` hides the write API entirely

### What you'll learn

Subject type selection is entirely about **late subscriber behavior**:

| Type | Late subscriber gets |
|---|---|
| `Subject` | Nothing — joins the stream from now |
| `BehaviorSubject(initialValue)` | The last emitted value immediately |
| `ReplaySubject(n)` | The last `n` emitted values immediately |

`asObservable()` is the RxJS equivalent of `signal.asReadonly()` — it strips the write API so consumers can only observe, not push. Always expose Subjects this way from services.

**v22 note:** `BehaviorSubject` is not dead, but its role has narrowed. Use `signal()` for state that lives entirely in the component/signal graph. Use `BehaviorSubject` when that state needs to feed into an RxJS pipeline — a signal can't be piped through `distinctUntilChanged`, `debounceTime`, or `switchMap` without `toObservable` first.

**`ReplaySubject` memory warning:** `new ReplaySubject()` with no argument buffers **every emission forever**. Always pass a buffer size. `new ReplaySubject(5)` keeps only the last 5.

### Hint

The choice is mechanical once you answer one question per scenario: *does a late subscriber need past values, and if so, how many?*

- No → `Subject`
- Yes, always exactly the latest one → `BehaviorSubject`
- Yes, the last N → `ReplaySubject(N)`

---

## Acceptance Criteria

- [ ] All 12 challenges implemented and working
- [ ] No `standalone: true` in any decorator
- [ ] No `@HostListener` / `@HostBinding` — use `host` object
- [ ] No constructor injection — use `inject()`
- [ ] No `@Input()` / `@Output()` decorators — use `input()` / `output()`
- [ ] No `async` pipe in Challenge 7 templates — signals only
- [ ] No memory leaks — all subscriptions cleaned up via `takeUntilDestroyed` or `toSignal`
- [ ] Errors handled in every pipeline — no unhandled rejections
- [ ] Each challenge is a self-contained component with a demo UI

---

## Operator Decision Map

| Situation                                            | Operator                      |
|------------------------------------------------------|-------------------------------|
| Fetch N items in parallel with a cap                 | `mergeMap(fn, N)` + `toArray` |
| Keep fetching until a condition is met               | `expand` + `takeWhile`        |
| Route one stream to many pipelines by key            | `groupBy` + `mergeMap`        |
| Running total where each step is async               | `mergeScan`                   |
| Split one stream into two without double-subscribing | `partition`                   |
| Batch high-frequency events into arrays              | `bufferTime`                  |
| Emit only the latest value in a time window          | `auditTime`                   |
| Expose an Observable as a Signal                     | `toSignal`                    |
| Use a Signal as an Observable source                 | `toObservable`                |
| Ignore new emissions while one is in flight          | `exhaustMap`                  |
| Derive state from multiple independent streams       | `combineLatest`               |
| Sample a secondary stream when a primary emits       | `withLatestFrom`              |
| Queue emissions and process one at a time, in order  | `concatMap`                   |
| Process each time window as a live stream            | `windowTime` + `mergeMap`     |
| Broadcast transient events, no history needed        | `Subject`                     |
| Share current state, late subscribers catch up       | `BehaviorSubject`             |
| Replay last N values to late subscribers             | `ReplaySubject(n)`            |
| Hide Subject write API from consumers                | `.asObservable()`             |

---

## Resources

- [RxJS Higher-Order Observables](https://rxjs.dev/guide/higher-order-observables)
- [groupBy — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/groupby)
- [expand — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/expand)
- [mergeScan — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/mergescan)
- [bufferTime — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/buffertime)
- [Signals Interop — Angular Docs](https://angular.dev/ecosystem/rxjs-interop)
- [toSignal — Angular Docs](https://angular.dev/api/core/rxjs-interop/toSignal)
- [toObservable — Angular Docs](https://angular.dev/api/core/rxjs-interop/toObservable)
- [exhaustMap — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/exhaustmap)
- [switchMap vs mergeMap vs concatMap vs exhaustMap — Angular University](https://blog.angular-university.io/rxjs-higher-order-mapping/)
- [combineLatest — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/combination/combinelatest)
- [withLatestFrom — RxJS Docs](https://rxjs.dev/api/operators/withLatestFrom)
- [concatMap — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/concatmap)
- [windowTime — Learn RxJS](https://www.learnrxjs.io/learn-rxjs/operators/transformation/windowtime)
- [Subject — RxJS Docs](https://rxjs.dev/guide/subject)
- [BehaviorSubject vs ReplaySubject — Angular Newsletter](https://www.angulartraining.com/daily-newsletter/subject-behaviorsubject-and-replaysubject/)
- [Subject vs BehaviorSubject vs ReplaySubject decision guide](https://codegen.studio/blog/aytumq/subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject-why-and-when/)
