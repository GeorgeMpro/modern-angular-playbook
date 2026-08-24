# Testing Reference — Ch09 Testing Patterns

Working reference for writing specs across `challenge-08-custom-directives`,
`challenge-11-centralized-error-handling`, `challenge-12-rxjs-patterns`, and
`challenge-07-auth-interceptors-guards`. Written after verifying this workspace's actual
configuration — not assumed from the spec `.md` files, which are stale on two points (see
"Corrections to the spec files" below).

---

## Verified project facts (checked directly, 2026-07-17)

- **Runner: Vitest, not Karma/Jasmine.** Every project's `angular.json` uses
  `"builder": "@angular/build:unit-test"` (the modern unified Angular builder, which runs
  Vitest). `package.json` has `"vitest": "^4.0.8"`, zero `karma`/`jasmine`.
- **Globals, no imports needed.** `tsconfig.spec.json` sets `"types": ["vitest/globals"]` —
  `describe`/`it`/`expect`/`vi` are all global, matching the existing (boilerplate) spec files.
- **Fully zoneless.** No `zone.js` dependency anywhere, no `provideZoneChangeDetection` in any
  `app.config.ts`. This matters: `fakeAsync`/`tick` from `@angular/core/testing` rely on zone.js
  patching timers — without it, they will not behave correctly here. Use Vitest's native fake
  timers instead (see below).
- **Existing specs are 100% boilerplate.** Every `.spec.ts` currently in these four projects
  is unmodified `ng generate` scaffolding (`it('should be created', () => expect(x).toBeTruthy())`).
  Zero real test content exists yet — nothing to break, nothing to preserve.

## Corrections to the spec files

Both `challenge-09-testing-patterns.md` and `challenge-angular-testing.md` were written
assuming Jasmine + Karma. Translate as you go:

| Spec file says (Jasmine) | Actually use (Vitest) |
|---|---|
| `jasmine.createSpyObj('Foo', ['method'])` | `{ method: vi.fn() }` (plain object with `vi.fn()` per method) |
| `spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `spyOn(...).and.returnValue(x)` | `vi.spyOn(...).mockReturnValue(x)` |
| `spyOn(...).and.callThrough()` | `vi.spyOn(...)` (calls through by default unless you `.mockImplementation()`) |
| `jasmine.any(Type)` | `expect.any(Type)` |
| `jasmine.objectContaining({...})` | `expect.objectContaining({...})` |
| `fakeAsync(() => {...})` + `tick(ms)` | `async () => {...}` + `vi.useFakeTimers()` / `await vi.advanceTimersByTimeAsync(ms)` |
| `discardPeriodicTasks()` | `vi.clearAllTimers()` (call in `afterEach`) |

`permission.spec.ts`'s example path in `challenge-09-testing-patterns.md`
(`challenge-08-custom-directives/src/app/directives/permission.ts`) and its `AuthService`
import are both wrong — real path is `09-permission/app-permission.ts`, real service is
`AuthMock` behind the `AUTH_SERVICE` token (see `shared/tokens/auth-service.token.ts`).

`RxJS`'s `TestScheduler`/marble syntax is unaffected by any of this — it's RxJS-native, not
tied to Jasmine or Vitest. Use it exactly as both spec files describe.

---

## Core principles (apply everywhere)

**SUT** = System Under Test — the one thing a test file is actually testing. Everything else
(a mock service, a stub dependency, a host component) exists only to isolate the SUT.

**TDD cycle — Red, Green, Refactor:**
1. **Red** — write one small failing test for the next smallest behavior. It should fail because
   the behavior doesn't exist yet, not because of a typo.
2. **Green** — write the minimum code to pass it. Hardcode if that's genuinely the fastest path;
   don't design ahead of the test.
3. **Refactor** — clean up names/structure with the passing test as a safety net. A feature isn't
   done at green — it's done after refactor. Skipping this step is the most common way people
   claim to do TDD and actually don't.

**FIRST principles** (Robert C. Martin, *Clean Code*) — a test that violates these is a test
worth rewriting:
- **F**ast — if you hesitate to run the suite after a one-line change, it's too slow.
- **I**ndependent — no test depends on another test's side effects or run order.
- **R**epeatable — same result every run, in any environment, no flaky timing/network dependence.
- **S**elf-validating — pass/fail is binary; nobody reads console output to decide if it worked.
- **T**imely — written right before (TDD) or right alongside the code it covers, not months later.

**SOLID applied to tests** (not the production code SOLID applies to — the *tests themselves*):
- **Single Responsibility** — one test asserts one behavior. "and" in a test name is a smell
  (`'adds toast and assigns id and sets actions'` → three tests, not one).
- **Dependency Inversion** — the SUT should depend on injectable abstractions (tokens, DI) so
  tests can substitute mocks. This project's `AUTH_SERVICE` injection token pattern is exactly
  this — that's *why* `appPermission` is easy to test with a fake auth service.

**What to assert — SUT vs dependency, not "component vs service":**
- Testing the SUT's own contract → assert its *output*: DOM for components/directives
  (`By.css`, presence/absence, applied class/style), return value/signal state for
  services/pipes. Never assert the SUT's own private internals.
- Testing that the SUT correctly *used a dependency* → spy on the dependency (not the SUT) and
  assert it was called correctly (e.g., interceptor → `ErrorLogger.logError` spy). This is the
  one legitimate place for interaction-based (spy) assertions.

**Arrange-Act-Assert** — structure every test in three visible parts: set up state, perform the
one action being tested, assert the result. Keeps tests scannable regardless of framework.

---

## Angular-specific patterns

### Pipes — no TestBed
Pure functions. `new AppTruncatePipe().transform(value, args)` directly. Bring in `TestBed`
only if the pipe has injected dependencies.

### Attribute directives — host component pattern
Don't test the directive class directly. Build a minimal `@Component` inline in the spec file
that applies it, per Angular's own official recommendation (testing all real components that
happen to use a directive is "tedious, brittle, and almost as unlikely to afford full coverage").

Key APIs:
- `By.directive(SomeDirective)` — finds elements with that directive, regardless of tag.
- `By.css('sel:not([appX])')` — finds elements *without* the directive, for negative cases.
- `debugElement.injector.get(SomeDirective)` — gets the directive instance to assert internal
  state if truly needed (rare — prefer DOM/output assertions).
- `DebugElement.styles` / `.properties` — read applied styles/properties without a real browser.
- `triggerEventHandler('mouseenter', null)` — fires through Angular's binding system directly,
  the right way to test `host`-bound event handlers.

### Structural directives — presence, not visibility
Assert DOM **null vs present**, never `display: none` — structural directives add/remove nodes
entirely (`vcr.clear()`/`createEmbeddedView`), they don't hide them.
```ts
expect(fixture.debugElement.query(By.css('button'))).toBeNull();
mockAuth.hasPermission.mockReturnValue(true);
fixture.detectChanges(); // re-runs the directive's effect()
expect(fixture.debugElement.query(By.css('button'))).not.toBeNull();
```

### Signal services
Read synchronously — `service.toasts()`, no async needed, no `fixture.detectChanges()` required
for a plain injected service (only needed when asserting through a component's rendered DOM).

### HTTP interceptors — `HttpTestingController`
```ts
providers: [provideHttpClient(withInterceptors([x])), provideHttpClientTesting()]
```
`controller.expectOne(url)` asserts exactly one request was made and returns a handle to
`.flush(body)` it. `afterEach(() => controller.verify())` fails the test if any request was
made but never asserted — catches invisible side-effect requests.

### Functional guards — `runInInjectionContext`
```ts
const result = TestBed.runInInjectionContext(() => authGuard(route, state));
```
No fake routing setup needed — this gives the guard function access to `inject()` directly.
For end-to-end navigation assertions, `RouterTestingHarness.create()` +
`harness.navigateByUrl(url)`.

### CDK component harnesses
- **Using one:** `TestbedHarnessEnvironment.loader(fixture)` → `loader.getHarness(X)` /
  `getAllHarnesses(X)` / `hasHarness(X)`. `X.with({ prop: val })` filters by predicate.
  `parallel(() => [...])` reads multiple harness properties in one change-detection cycle.
- **Writing one:** extend `ComponentHarness`, set `static hostSelector`, expose only semantic
  methods (`getTitleText()`), never raw `TestElement`s. `locatorFor()` (throws if missing),
  `locatorForOptional()` (returns `null`), `locatorForAll()` (array). The payoff: rename an
  internal `h1`→`h2` and only the harness's `locatorFor()` call changes — every test using
  `getTitleText()` keeps passing.

---

## Vitest-specific patterns (this project's actual runner)

```ts
// spies — no import needed, vi is global
const spy = vi.fn();
const spy2 = vi.spyOn(service, 'method').mockReturnValue(42);
expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));

// fake timers — replaces fakeAsync/tick in this zoneless workspace
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.clearAllTimers());

it('auto-dismisses after duration', async () => {
  service.addToast({ duration: 2000 });
  await vi.advanceTimersByTimeAsync(1999);
  expect(service.toasts().length).toBe(1); // still there
  await vi.advanceTimersByTimeAsync(1);
  expect(service.toasts().length).toBe(0); // gone
});
```

`advanceTimersByTimeAsync` (not the sync `advanceTimersByTime`) when the code under test
involves Promises/RxJS microtasks alongside `setTimeout` — the async variant flushes both.

---

## Marble testing (RxJS-native, unaffected by runner choice)

```ts
import { TestScheduler } from 'rxjs/testing';

const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

scheduler.run(({ hot, cold, expectObservable }) => {
  // timer(1000) resolves in 0ms of real time here
});
```

| Symbol | Meaning |
|---|---|
| `-` | 1 virtual frame |
| `a`/`b`/`c` | emitted value (mapped via a values dict) |
| `\|` | completion |
| `#` | error |
| `( )` | synchronous emissions in the same frame |
| `1000ms a` | 1000ms delay, then emit `a` |

For retry/backoff operators: count `defer()` factory invocations, not subscriber callbacks —
`defer` re-executes its factory on every retry, which is what actually proves a retry happened.

---

## Sources

- [TDD Red-Green-Refactor guide](https://www.codecademy.com/article/tdd-red-green-refactor)
- [Martin Fowler — Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [FIRST Principles](https://dzone.com/articles/first-principles-solid-rules-for-tests)
- [Angular — Component testing scenarios](https://angular.dev/guide/testing/components-scenarios)
- [Angular — Testing attribute directives](https://angular.dev/guide/testing/attribute-directives)
- [Angular — Migrating from Karma to Vitest](https://angular.dev/guide/testing/migrating-to-vitest)
- [Angular — Component harnesses](https://angular.dev/guide/testing/component-harnesses)
- [RxJS — TestScheduler marble testing](https://rxjs.dev/guide/testing/marble-testing)
