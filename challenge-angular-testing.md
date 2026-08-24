# Challenge: Angular Testing

**Difficulty:** Hard **Angular Version:** 22+ **Focus:** Pipes, attribute directives, structural directives, HTTP interceptors, guards, RxJS marble testing, CDK harnesses, custom harnesses

---

## Context

**There is no new app to build.** Every section uses code that already exists across the challenges repo. You're writing tests for real code you already wrote.

| Section              | System Under Test                                        | Challenge     |
|----------------------|----------------------------------------------------------|---------------|
| Pipe                 | New `AppTruncatePipe`                                    | New (warm-up) |
| Attribute directives | `appHighlight`, `appClickOutside`, `appNumbersOnly`      | Ch08          |
| Structural directive | `appPermission`                                          | Ch08          |
| Marble testing       | `retryOnNetworkError`, `retryWithBackoff`, `gatherArray` | Ch11, Ch12    |
| HTTP interceptor     | `loginInterceptor`                                       | Ch07          |
| Guards               | `authGuard`, `roleGuard`                                 | Ch07          |
| Service with timers  | `ToastService`                                           | Ch11          |
| CDK harnesses        | `DemoShell`                                              | Ch08          |
| Custom harness       | `DemoShellHarness`                                       | Ch08          |

---

## What's New vs What You Already Know

| Already done (english-games) | New in this challenge                         |
|------------------------------|-----------------------------------------------|
| Service testing with TestBed | Marble testing with `TestScheduler.run()`     |
| `fakeAsync` + `tick`         | `By.directive()` + host component pattern     |
| Browser API mocking          | Structural directive DOM assertions           |
| Integration tests            | CDK component harnesses                       |
| `spyOn` + `callThrough`      | Creating a custom harness                     |
| Data-testid DOM queries      | `HttpTestingController`                       |
| Scenarios array              | `runInInjectionContext` for functional guards |

---

## Section 1: Pipe Testing

**Concept:** Isolated unit testing — no `TestBed` needed

### Task

Write `AppTruncatePipe`. Takes a string and a max-length number. If the string exceeds max-length, truncate and append `...`. If it fits, return unchanged. Handle `null` and `undefined` (return `''`).

Test with **direct instantiation only** — no `TestBed`, no `ComponentFixture`:

```ts
const pipe = new AppTruncatePipe();
expect(pipe.transform('Hello World', 5)).toBe('Hello...');
```

Cover: normal truncation, exact boundary, under boundary, null, undefined, empty string.

### What You'll Learn

Pipes are pure functions — `transform(value, ...args)` is the entire API. `TestBed` is overhead here. When a pipe has injected dependencies, then you bring `TestBed` in. Otherwise don't.

---

## Section 2: Attribute Directive Testing

**Concept:** Host component pattern, `By.directive()`, `DebugElement`, `triggerEventHandler()`

**SUT:** `appHighlight`, `appClickOutside`, `appNumbersOnly` from Ch08

### The Pattern

Create a minimal host component **inside the spec file** that applies the directive. This is the standard approach — don't repurpose a real component:

```ts

@Component({
  template: `<p [appHighlight]="color" [defaultColor]="'yellow'">text</p>`
})
class HostComponent {
  color = '#ff0000';
}
```

### Key APIs

**`By.directive(Highlight)`** — finds elements with that directive applied, regardless of element type:

```ts
const el = fixture.debugElement.query(By.directive(Highlight));
```

**`By.css('p:not([appHighlight])')`** — finds elements that do NOT have the directive.

**`debugElement.injector.get(Highlight)`** — gets the directive instance from the element's injector. Lets you assert internal directive state directly.

**`DebugElement.styles`** — reads computed styles without a real browser. Platform-safe.

**`triggerEventHandler('mouseenter', null)`** — fires through Angular's binding system, not via native DOM. This is what you should use for `host`-bound events.

### Tests to Write

`appHighlight`:

- Background is empty before hover
- Background is set to the input on `mouseenter`
- Background is cleared on `mouseleave`
- Font color switches based on luminance
- `effect()` re-runs when `appHighlight` input changes (update `color`, call `detectChanges()`, assert new bg)

`appClickOutside`:

- `clickOutside` emits when clicking outside the host element
- `clickOutside` does NOT emit when clicking inside

`appNumbersOnly`:

- Digit keystrokes pass through
- Letter keystrokes call `event.preventDefault()`
- Paste event strips non-numeric characters and sets cleaned value

### What You'll Learn

`triggerEventHandler` calls your `host` handler directly — no real browser event needed. `By.directive()` locates directives without coupling to tag names or CSS classes. `debugElement.injector.get()` is how you reach the directive instance itself.

---

## Section 3: Structural Directive Testing

**Concept:** DOM presence assertions, not style visibility

**SUT:** `appPermission` from Ch08

### Task

Structural directives add and remove elements from the DOM — assertions must check **null vs present**, not `display: none`. Create a mock `AuthService` with controllable permission state.

### Tests to Write

- Button is absent from DOM when user lacks permission
- Button is present in DOM when user has permission
- Button is removed when permission is revoked (signal changes → `effect()` re-runs → `vcr.clear()`)
- Button is re-added when permission is granted after revocation

```ts
expect(fixture.debugElement.query(By.css('button'))).toBeNull();

authService.grantPermission('admin');
fixture.detectChanges();

expect(fixture.debugElement.query(By.css('button'))).not.toBeNull();
```

### What You'll Learn

`vcr.clear()` removes the element from the DOM entirely — it's not hidden, it doesn't exist. `fixture.detectChanges()` after a signal/state change triggers `effect()` re-evaluation. This is fundamentally different from attribute directive tests.

---

## Section 4: Marble Testing

**Concept:** `TestScheduler.run()`, virtual time, declarative timing specs

**SUT:** `retryOnNetworkError` (Ch11), `retryWithBackoff` + `gatherArray` (Ch12)

### Why Marble Testing

`fakeAsync`/`tick` works but it's imperative — you say "advance time by 1000ms, now check." Marble testing is declarative — you specify the entire timing behaviour as a diagram and assert the output matches another diagram. Cleaner, more readable, and catches timing edge cases `tick` misses.

### Setup

```ts
import {TestScheduler} from 'rxjs/testing';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

testScheduler.run(({hot, cold, expectObservable}) => {
  // virtual time — timer(1000) runs instantly
});
```

### Marble Syntax

| Symbol        | Meaning                                 |
|---------------|-----------------------------------------|
| `-`           | 1 virtual frame                         |
| `a`, `b`, `c` | emitted value (mapped in values dict)   |
| `\|`          | completion                              |
| `#`           | error                                   |
| `( )`         | synchronous emissions in the same frame |
| `1000ms a`    | 1000ms delay then emit `a`              |

### Tests to Write

**`retryWithBackoff` (Ch12)** — `retry({ count, delay: (err, n) => timer(baseDelayMs * n) })`:

- Succeeds on first try → no retries
- Fails twice then succeeds → emits after two delays (`baseDelayMs * 1`, `baseDelayMs * 2`)
- Exhausts all retries → errors

**`retryOnNetworkError` (Ch11)** — retries only on 503/500/0, with exponential backoff (`Math.pow(2, n-1) * 1000`):

- 503 error → retries with exponential delay
- 404 error → does NOT retry, rethrows immediately
- 4 consecutive 503s → errors after exhausting retries
- Backoff is exponential: 1s, 2s, 4s, 8s

**`gatherArray` (Ch12)** — `scan` that accumulates emissions into an array:

- Three emissions → produces `[a]`, `[a,b]`, `[a,b,c]`
- Error mid-stream → `catchError(() => EMPTY)` — no error propagated, stream just ends

### What You'll Learn

`TestScheduler.run()` gives you **virtual time** — `timer(1000)` runs in 0ms of real time. Exponential backoff logic that would take 15 seconds to verify with `tick()` runs instantly. The marble string IS the spec — you can see the timing behaviour at a glance.

---

## Section 5: HTTP Interceptor Testing

**Concept:** `HttpTestingController`, asserting request headers, functional interceptors

**SUT:** `loginInterceptor` from Ch07

The interceptor reads a token from `LoginService` and adds `Authorization: Bearer <token>` to every outgoing request. If no token, passes the request through unmodified.

### Setup

```ts
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(withInterceptors([loginInterceptor])),
    provideHttpClientTesting(),
    LoginService
  ]
});

const http = TestBed.inject(HttpClient);
const controller = TestBed.inject(HttpTestingController);
```

### Tests to Write

- Request includes `Authorization: Bearer <token>` when token exists
- Request passes through unmodified when no token
- Token value in header matches exactly what `LoginService.getToken()` returns
- Interceptor does not mutate the original request object (check `req.headers` before vs after)

```ts
http.get('/api/data').subscribe();
const req = controller.expectOne('/api/data');
expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
req.flush({});
```

### What You'll Learn

`HttpTestingController` intercepts requests before they hit the network. `expectOne(url)` asserts exactly one request was made to that URL and returns it. `req.flush(body)` resolves the request with mock data. `afterEach(() => controller.verify())` ensures no unexpected requests were made.

---

## Section 6: Guard Testing

**Concept:** `runInInjectionContext`, `UrlTree`, `RouterTestingHarness`

**SUT:** `authGuard` and `roleGuard` from Ch07

### Testing Functional Guards in Isolation

Functional guards are just functions — test them directly inside `TestBed.runInInjectionContext()`:

```ts
const result = TestBed.runInInjectionContext(() =>
  authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
);
expect(result).toBeTrue();
```

No routing setup needed. `runInInjectionContext` gives the function access to the DI tree so `inject()` inside the guard works.

### Tests to Write

**`authGuard`**:

- Returns `true` when token exists
- Navigates to `/login` and returns `false` when no token
- Note: the current implementation uses `router.navigate()` (side effect) rather than returning a `UrlTree`. Test both the return value AND that `router.navigate` was called with `['login']`.

**`roleGuard`**:

- Returns `true` when user role matches required role
- Returns a `UrlTree` pointing to `/forbidden` when role doesn't match
- `UrlTree` is the cleaner approach — assert `result instanceof UrlTree` and check `result.toString()`

```ts
const result = TestBed.runInInjectionContext(() =>
  roleGuard('admin')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
);
expect(result instanceof UrlTree).toBeTrue();
```

**`RouterTestingHarness`** — end-to-end navigation test:

```ts
const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/admin');
expect(TestBed.inject(Router).url).toBe('/forbidden');
```

### What You'll Learn

`runInInjectionContext` is the clean way to test functional guards — no fake route setup needed. The difference between `router.navigate()` (side effect, harder to test) and returning a `UrlTree` (pure, assertable) is a real design trade-off worth understanding.

---

## Section 7: Service with Timers

**Concept:** `fakeAsync` + `tick`, signal assertions, timer cleanup

**SUT:** `ToastService` from Ch11

`ToastService` uses `setTimeout` internally to auto-dismiss toasts after `duration` ms. It maintains a `Map` of timers and clears them on manual dismiss.

### Tests to Write

- `addToast` adds a toast to the `toasts` signal
- `dismissToast` removes the toast and clears its timer
- Toast auto-dismisses after its `duration` using `fakeAsync` + `tick(duration)`
- Manually dismissing before timeout cancels the auto-dismiss (use `discardPeriodicTasks()` or verify no double-dismiss)
- `STATUS_ACTIONS` — each toast type gets the correct actions (error: retry + dismiss, success: undo + dismiss, etc.)
- `addToast` assigns a unique incrementing ID to each toast
- Dismiss callback on `retryAction` removes and re-adds the toast

Note: the constructor pre-loads `dummyMessages`. Either spy to prevent this or account for them in your assertions. This is a known issue flagged in the Ch11 pending fixes.

### What You'll Learn

Testing services that own timers requires `fakeAsync`/`tick`. Signal assertions are synchronous — read `service.toasts()` directly. `discardPeriodicTasks()` clears any remaining timers in a `fakeAsync` zone to avoid "1 timer (s) still in the queue" errors.

---

## Section 8: Using CDK Harnesses

**Concept:** `TestbedHarnessEnvironment`, `HarnessLoader`, `getHarness()`, `parallel()`

**SUT:** `DemoShell` from Ch08

### Setup

```ts
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';

const loader = TestbedHarnessEnvironment.loader(fixture);
```

### Key APIs

- `loader.getHarness(SomeHarness)` — first matching instance
- `loader.getAllHarnesses(SomeHarness)` — all instances
- `loader.hasHarness(SomeHarness)` — boolean check
- `loader.getHarness(SomeHarness.with({ title: 'Highlight' }))` — filtered by predicate

`parallel()` runs multiple async harness calls simultaneously:

```ts
import {parallel} from '@angular/cdk/testing';

const [title, hasControls] = await parallel(() => [
  shell.getTitleText(),
  shell.hasControls()
]);
```

### Task

Use `DemoShellHarness` (written in Section 9) in tests for the `DirectiveDisplay` component, which renders multiple `DemoShell` instances. Use `getAllHarnesses` to query all of them and `with()` to get a specific one by title.

In the same test file: write one test using raw `querySelector` and one using the harness for the same assertion. The raw test should break when you rename the `h1` to `h2`. The harness test should not (because you update only the harness's `locatorFor`).

### What You'll Learn

Harnesses test **intent** not **structure**. When markup changes, the harness absorbs the change — tests stay stable. `parallel()` is the correct way to read multiple harness properties in one change detection cycle.

---

## Section 9: Writing a Custom Harness

**Concept:** `ComponentHarness`, `hostSelector`, `locatorFor()`, `HarnessPredicate`

**SUT:** `DemoShell` from Ch08 (selector: `app-demo-shell`, renders a title via `input.required<string>()`)

### Structure

```ts
import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';

export class DemoShellHarness extends ComponentHarness {
  static hostSelector = 'app-demo-shell';

  private getTitle = this.locatorFor('h1');
  private getControlsSlot = this.locatorForOptional('[controls]');
  private getAllPreviews = this.locatorForAll('[preview]');

  async getTitleText(): Promise<string> {
    return (await this.getTitle()).text();
  }

  async hasControls(): Promise<boolean> {
    return (await this.getControlsSlot()) !== null;
  }

  async getPreviewCount(): Promise<number> {
    return (await this.getAllPreviews()).length;
  }

  static with(options: { title?: string } = {}): HarnessPredicate<DemoShellHarness> {
    return new HarnessPredicate(DemoShellHarness, options)
      .addOption('title', options.title, async (harness, title) =>
        (await harness.getTitleText()).toLowerCase() === title.toLowerCase()
      );
  }
}
```

### Key Rules

- `locatorFor()` returns a **factory function** — call it (with `await`) to get the `TestElement`
- `locatorForOptional()` returns `null` if not found — use for optional slots
- `locatorForAll()` returns an array
- Expose semantic methods (`getTitleText()`) — never expose internal `TestElement` instances to harness users
- `HarnessPredicate.addOption()` registers a filter — the `with()` static method is the convention

### What You'll Learn

`hostSelector` identifies which DOM element the harness wraps. The semantic method pattern is what makes harnesses maintainable — if you rename the internal `h1`, you update `locatorFor('h2')` in one place, and all tests using `getTitleText()` continue to pass without changes.

---

## Acceptance Criteria

- [ ] `AppTruncatePipe` tested with direct instantiation — no `TestBed`, all edge cases covered
- [ ] `appHighlight` tested: host component pattern, `By.directive()`, `triggerEventHandler()`, `DebugElement.styles`
- [ ] `appClickOutside` tested: outside-click emits, inside-click does not
- [ ] `appNumbersOnly` tested: key blocking + paste stripping
- [ ] `appPermission` tested: DOM null assertions, element added/removed on permission change
- [ ] `retryWithBackoff` (Ch12) tested with `TestScheduler.run()`: success, partial retry, exhausted retry
- [ ] `retryOnNetworkError` (Ch11) tested with marbles: 503 retries, 404 does not, exponential timing verified
- [ ] `gatherArray` (Ch12) tested with marbles: accumulation and error suppression
- [ ] `loginInterceptor` tested with `HttpTestingController`: header added, passthrough when no token
- [ ] `authGuard` tested with `runInInjectionContext`: return value + `router.navigate` spy
- [ ] `roleGuard` tested: `true` on match, `UrlTree` on mismatch
- [ ] `RouterTestingHarness` used for at least one end-to-end navigation test
- [ ] `ToastService` tested with `fakeAsync`/`tick`: add, dismiss, auto-dismiss, action assignment
- [ ] `DemoShellHarness` written: `hostSelector`, `locatorFor`, `locatorForOptional`, `HarnessPredicate.with()`
- [ ] Harness used in tests: `getHarness`, `getAllHarnesses`, `parallel()`

---

## Pattern Quick Reference

| Topic                | Key API                                                                      | Source     |
|----------------------|------------------------------------------------------------------------------|------------|
| Pipe                 | `new AppTruncatePipe().transform(value, args)`                               | New        |
| Attribute directive  | `By.directive()`, `injector.get()`, `triggerEventHandler()`                  | Ch08       |
| Structural directive | `query(By.css(...))` → `toBeNull()` / `not.toBeNull()`                       | Ch08       |
| Marble testing       | `TestScheduler.run()`, `hot()`, `cold()`, `expectObservable()`               | Ch11, Ch12 |
| HTTP interceptor     | `HttpTestingController`, `expectOne()`, `req.flush()`, `controller.verify()` | Ch07       |
| Guard                | `TestBed.runInInjectionContext(() => guard(...))`, `UrlTree`                 | Ch07       |
| Routing              | `RouterTestingHarness.create()`, `harness.navigateByUrl()`                   | Ch07       |
| Service/timers       | `fakeAsync`, `tick(duration)`, signal read, `discardPeriodicTasks()`         | Ch11       |
| Using harnesses      | `TestbedHarnessEnvironment.loader(fixture)`, `getHarness()`, `parallel()`    | Ch08       |
| Creating harnesses   | `ComponentHarness`, `locatorFor()`, `HarnessPredicate`                       | Ch08       |

---

## Resources

- [Angular Testing Docs](https://angular.dev/guide/testing)
- [Testing Attribute Directives — Angular](https://angular.dev/guide/testing/attribute-directives)
- [Component Harnesses Overview — Angular](https://angular.dev/guide/testing/component-harnesses)
- [Using Component Harnesses — Angular](https://angular.dev/guide/testing/using-component-harnesses)
- [Creating Component Harnesses — Angular](https://angular.dev/guide/testing/creating-component-harnesses)
- [Testing Routing — Angular](https://angular.dev/guide/testing/routing)
- [RxJS Marble Testing — mokkapps.de](https://mokkapps.de/blog/how-i-write-marble-tests-for-rxjs-observables-in-angular)
- [Effective RxJS Marble Testing — angular.love](https://angular.love/effective-rxjs-marble-testing)
- [TestScheduler — RxJS](https://rxjs.dev/api/testing/TestScheduler)
- [RouterTestingHarness — Angular](https://angular.dev/api/router/testing/RouterTestingHarness)
- [HttpTestingController — Angular](https://angular.dev/api/http/testing/HttpTestingController)
