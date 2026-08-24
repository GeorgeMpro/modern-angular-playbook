# Angular Component Testing — Concept Reference

Personal reference for `components-basics` + `components-scenarios` — concepts/APIs to remember,
not a how-to-write-this-spec guide. For project-specific TDD/Vitest/SOLID-for-tests guidance, see
`TESTING-GUIDE.md` instead.

Sources: [Basics of testing components](https://angular.dev/guide/testing/components-basics) ·
[Component testing scenarios](https://angular.dev/guide/testing/components-scenarios) ·
[Testing routing and navigation](https://angular.dev/guide/routing/testing)

---

## Fixture fundamentals

```ts
TestBed.configureTestingModule({ providers: [...] });
const fixture = TestBed.createComponent(Banner);
const component = fixture.componentInstance;
await fixture.whenStable();
```

- `fixture.componentInstance` — the component class instance.
- `fixture.nativeElement` — raw `HTMLElement`, root of the component's DOM.
- `fixture.debugElement` — see below.
- `await fixture.whenStable()` — waits for pending async work (incl. initial signal-input
  binding) before you assert. Without it, bindings may not have applied yet.
- **`setup()` function** — alternative to `beforeEach` when different tests need different
  providers (`beforeEach` runs identically for every test in the block):
  ```ts
  function setup(providers?: StaticProviders[]): ComponentFixture<Banner> {
    TestBed.configureTestingModule({ providers });
    return TestBed.createComponent(Banner);
  }
  ```

## `DebugElement` vs `HTMLElement`

- `DebugElement` — Angular's cross-platform wrapper around a native element (or a
  component/directive host). Works even where there's no real DOM (SSR, non-browser renderers).
  Exposes `.nativeElement`, `.componentInstance`, `.injector`, `.query()`/`.queryAll()`,
  `.triggerEventHandler()`, `.properties`, `.styles`.
- `HTMLElement` — the actual DOM node. `debugElement.nativeElement` unwraps to it.
- `By.css(selector)` — query predicate for `.query()`/`.queryAll()`, returns `DebugElement`(s):
  ```ts
  const paragraphDe = fixture.debugElement.query(By.css('p'));
  const p: HTMLElement = paragraphDe.nativeElement;
  ```
- Direct DOM access (`nativeElement.querySelector`) is always fine in tests — tests run in a real
  DOM (browser/jsdom) regardless of whether the app is SSR in production. `Renderer2` (avoiding
  direct DOM APIs) is an *app* code concern for surviving non-browser runtimes, irrelevant here.

## Inputs & outputs

- **`componentRef.setInput(name, value)`** — correct way to set an `@Input`/`input()` in tests.
  Properly marks `OnPush` components for check and runs `ngOnChanges`. Direct property assignment
  (`comp.hero = x`) skips both — can pass in tests while not matching real parent-binding behavior.
  ```ts
  fixture.componentRef.setInput('hero', expectedHero);
  ```
- **`output()`'s `OutputRef.subscribe(cb)`** — single next-only callback, `(value: T) => void`.
  No error/complete (unlike a full RxJS `Observable`/classic `EventEmitter`/`Subject`).
  ```ts
  comp.selected.subscribe((hero: Hero) => (selectedHero = hero));
  ```

## Triggering events

- **`nativeElement.click()`** — real DOM click. The docs' preferred default when the element is
  real and reachable.
- **`debugElement.triggerEventHandler(eventName, eventObj?)`** — calls the bound template handler
  (e.g. `(click)="click()"`) directly, no real DOM dispatch. Breaks if the handler reads properties
  off the event object and you didn't pass a matching fake one — e.g. `RouterLink` needs
  `{ button: 0 }`.
- **`click()` helper** (from the docs, not a built-in) — dispatches to whichever based on type:
  ```ts
  export function click(el: DebugElement | HTMLElement, eventObj: any = { button: 0 }): void {
    if (el instanceof HTMLElement) el.click();
    else el.triggerEventHandler('click', eventObj);
  }
  ```
- Setting a native input's `.value` directly fires no event — Angular's bindings listen for real
  DOM events, not property writes. Always follow with a dispatched event:
  ```ts
  page.nameInput.value = newName;
  page.nameInput.dispatchEvent(new Event('input'));
  ```

## Test host components

Wrap the SUT in a small, test-only `@Component` that data-binds it for real, instead of poking it
programmatically (`setInput`/`.subscribe()`). Exercises the actual binding contract:
```ts
@Component({
  imports: [DashboardHero],
  template: `<dashboard-hero [hero]="hero" (selected)="onSelected($event)" />`,
})
class TestHost {
  hero: Hero = { id: 42, name: 'Test Name' };
  onSelected(hero: Hero) { this.selectedHero = hero; }
}
```
Not a mock — a real minimal parent, used when a real app parent would be too heavy to bring in.

## Routing & routed components

```ts
providers: [provideRouter([{ path: 'heroes/:id', component: HeroDetail }])]
harness = await RouterTestingHarness.create();
component = await harness.navigateByUrl(`/heroes/${id}`, HeroDetail);
```
- Drives a **real** (test-mode) `Router` — navigation builds the real `ActivatedRoute` and injects
  it, no manual `ActivatedRoute` mocking needed.
- `harness.routeDebugElement` / `harness.routeNativeElement` — typed `X | null` (`null` if the
  `RouterOutlet` never activated, e.g. a guard rejected navigation). Commonly force-unwrapped with
  `!` once you know navigation succeeded.
- **`By.directive(SomeDirective)` + `debugElement.injector.get(SomeDirective)`** — gets the actual
  directive *instance* attached to an element (not just its DOM node), so you can read real
  directive properties:
  ```ts
  linkDes = fixture.debugElement.queryAll(By.directive(RouterLink));
  routerLinks = linkDes.map((de) => de.injector.get(RouterLink));
  ```
- `TestBed.inject(Router)` — grab the real `Router` directly. `.resetConfig([...])` to isolate
  navigation in a test; `.url` to assert the result after `await fixture.whenStable()`.

## Routing testing — dedicated scenarios

Beyond the basics above, the dedicated routing-testing guide covers:

- **Route guards** — mock the guard's *dependency*, not the guard itself; provide a real route
  config with `canActivate: [authGuard]`; assert on which component actually rendered after
  navigation, not the guard's return value directly.
  ```ts
  const authStore = { isAuthenticated: vi.fn().mockReturnValue(false) } as Mocked<AuthStore>;
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthStore, useValue: authStore },
      provideRouter([
        { path: 'protected', component: Protected, canActivate: [authGuard] },
        { path: 'login', component: Login },
      ]),
    ],
  });
  await harness.navigateByUrl('/protected', Login); // redirected
  ```
- **Router outlets** — explicitly called out as an *integration* test (Router + outlet + rendered
  components together, not a unit test of one thing). Use throwaway mock components per route to
  verify the right one renders for each path.
- **Nested routes** — `children: [...]` in the route config; assert both parent and child content
  appear after navigating to the nested URL — proves both layers wired their own route data
  correctly.
- **Query params/fragments** — `toSignal(route.queryParams, { initialValue: {} })`, tested by
  navigating with the query string baked into the URL and reading the *component's* signal
  directly, not just DOM text:
  ```ts
  component = await harness.navigateByUrl('/search?q=angular', Search);
  expect(component.searchTerm()).toBe('angular');
  ```
  Unlike route params, query params don't trigger a route change — test both initial load and
  reactive updates when they change without full navigation.

**Best practices (stated explicitly in the guide, not just implied):**
- Prefer `RouterTestingHarness` over test-host components for routed components — cleaner API,
  built-in navigation. Named outlets are the one case it's not well-suited for.
- Dependency preference order: real implementation > fake > mock/stub. Mocks are explicitly called
  a "last resort" — brittle, less reliable.
- **Never mock the Router itself** — use real route configs + harness navigation. Mocking it can
  hide real breaking changes when Angular's router internals update.
- Router navigation is async — always `async/await` it.
- Test failure paths too: invalid routes, failed navigation, guard rejections — not just the happy
  path.

## Page objects

A plain class whose fields are **getters** wrapping DOM queries — no constructor, no stored refs:
```ts
class Page {
  get saveBtn() { return this.queryAll<HTMLButtonElement>('button')[0]; }
  get nameDisplay() { return this.query<HTMLElement>('span'); }
  private query<T>(sel: string): T { return harness.routeNativeElement!.querySelector(sel)! as T; }
  private queryAll<T>(sel: string): T[] { return harness.routeNativeElement!.querySelectorAll(sel) as any; }
}
```
- Getters re-query fresh on every read — no stale element captured at construction time.
- Centralizes every raw selector in one place; tests read as `page.nameDisplay.textContent`
  instead of scattering `querySelector('span')` everywhere. Template changes → fix once.

## Provider overrides & test doubles

- Module/root-level swap: `providers: [{ provide: X, useValue: {} }]` / `useClass` / `useFactory`.
- **`TestBed.overrideComponent(X, { set: { providers: [...] } })`** — overrides a *component's
  own* `providers`. Needed because Angular's hierarchical injector resolves nearest-provider-first
  — if a component provides its own service, an outer/module-level override never gets reached.
  Not about injection tokens vs classes — same fix needed either way; it's about *where* in the
  hierarchy the provider lives.
- **Spy stubs**: `vi.fn(impl)` — wraps a fake implementation *and* records calls
  (`toHaveBeenCalledTimes`, `toHaveBeenCalledWith`). A plain function gives you the fake return
  value but no call-tracking. `vi.spyOn(obj, 'method')` is the other case — wrapping something
  that already exists on a real object (maps to Jasmine's `spyOn`, vs `vi.fn` mapping to
  `jasmine.createSpy().and.callFake()`).
  ```ts
  class HeroDetailServiceSpy {
    getHero = vi.fn(() => asyncData({ ...this.testHero }));
  }
  hdsSpy = harness.routeDebugElement!.injector.get(HeroDetailService) as any;
  ```

## Stubbing unneeded child components

- Write stub `@Component`s with matching selectors + empty templates, swap via
  `TestBed.overrideComponent(App, { set: { imports: [BannerStub, WelcomeStub] } })` — real
  (if empty) components still exist, still queryable.
- Or combine with **`NO_ERRORS_SCHEMA`**: `overrideComponent(App, { remove: { imports: [X, Y] },
  set: { schemas: [NO_ERRORS_SCHEMA] } })` — deletes the real imports, then tells the compiler to
  silently ignore the now-unrecognized template tags entirely (nothing rendered, nothing
  queryable). Less setup than writing stub classes, but the schema also swallows genuine
  typos/misspelled selectors — a real trade-off, not free.

## Async & HTTP testing

- **`HttpTestingController`** — simulate a real HTTP response without a server:
  ```ts
  const req = TestBed.inject(HttpTestingController).expectOne('api/heroes');
  req.flush(mockData);
  ```
  `afterEach(() => controller.verify())` fails the test if any request was made but never
  asserted.
- **Vitest fake timers** — the current recommended approach:
  ```ts
  vi.useFakeTimers();
  const fixture = TestBed.createComponent(Twain);
  await vi.runAllTimersAsync(); // or: await vi.advanceTimersByTimeAsync(ms)
  vi.useRealTimers();
  ```
- **`fakeAsync`/`tick` (zone.js)** — per Angular's own current docs, explicitly **"no longer
  recommended"** and **"cannot be used with the Vitest test runner."** Use Vitest fake timers
  instead in any zoneless/Vitest workspace.
