# Challenge #8: Custom Directives Library

**Difficulty:** Medium
**Angular Version:** 22+
**Focus:** Attribute directives, structural directives, Directive Composition API, browser APIs

---

## Context

Directives are Angular's mechanism for attaching reusable behavior to DOM elements. A well-built directive library eliminates copy-paste logic across components and is one of the clearest signals of senior-level Angular work — every interview that asks "how do you share behavior across components without inheritance?" is answered here.

## Directive 1: `appLazyLoad`

**Concept:** IntersectionObserver, lazy image loading

### The Problem

Loading all images on page load wastes bandwidth and slows LCP. Images below the fold should load only when they're about to enter the viewport.

### Task

Apply to an `<img>` element. The directive holds a `src = input.required<string>()`. On init, set `src=""` on the element. Create an `IntersectionObserver` — when the element becomes visible, set the real `src` via `Renderer2` and disconnect the observer (fire-once).

### Behavior

- Image `src` is empty until the element enters the viewport
- Observer disconnects immediately after the first intersection — no repeated triggers
- Works on any `<img>` regardless of its container

### What you'll learn

[`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#creating_an_intersection_observer) fires a callback when the observed element crosses a visibility threshold. `disconnect()` after the first hit makes it fire-once — unlike `appAnimateOnScroll` (directive 12) which can fire repeatedly.

---

## Directive 2: `appDebounceClick`

**Concept:** `outputFromObservable`, `Subject`, `debounce`

### Task

Debounce button clicks to prevent duplicate submissions. Emits a debounced `btnClick` output instead of the native click event.

```ts
readonly
timeDelay = input<number>(300);
private readonly
clickListener$ = new Subject<void>();
readonly
btnClick = outputFromObservable(
  this.clickListener$.pipe(debounce(() => timer(this.timeDelay())))
);
```

**Already implemented** — review it and make sure `onClick` in the `host` is `private`.

### What you'll learn

`outputFromObservable` converts an `Observable` to an Angular `output()` — cleanup is automatic. The `Subject` is the imperative trigger, the pipe is the declarative transform.

---

## Directive 3: `appInfiniteScroll`

**Concept:** `throttleTime`, `afterNextRender`, scroll threshold

### Task

Trigger a `scrollEnd` output when the user scrolls past a configurable threshold (default 80%) of a scrollable container.

**Already implemented** — review that `afterNextRender` fires the initial threshold check (catches containers already scrolled past 80% before any scroll event).

---

## Directive 4: `appClickOutside`

**Concept:** `document` event listener, `ElementRef`

### The Problem

Dropdowns and popovers need to close when the user clicks anywhere outside them. Listening to clicks on the host element doesn't help — you need a document-level listener that filters out clicks inside the element.

### Task

```ts
readonly
clickOutside = output<void>();
private readonly
el = inject(ElementRef<HTMLElement>);
```

In `host`:

```ts
host: {
  '(document:click)'
:
  'onDocClick($event)'
}
```

In `onDocClick(event: MouseEvent)`: if `!this.el.nativeElement.contains(event.target as Node)`, emit `clickOutside`.

### Behavior

- Only emits when the click target is outside the host element
- Works on any element (divs, custom components, inputs)
- Automatically cleaned up when the directive is destroyed

### What you'll learn

`(document:click)` in the `host` object registers a document-level listener scoped to this directive's lifetime — Angular removes it on destroy automatically. No manual `removeEventListener` needed.

---

## Directive 5: `appCopyToClipboard`

**Concept:** Clipboard API, async output

### The Problem

Any element can become a "click to copy" button. The directive handles the Clipboard API and emits success/failure — the consumer decides what to show (toast, icon swap, etc.).

### Task

```ts
readonly
textToCopy = input.required<string>();
readonly
copied = output<boolean>(); // true = success, false = failed
```

`host`: `'(click)': 'onCopy()'`

`onCopy()`: call `navigator.clipboard.writeText(this.textToCopy())`, `.then(() => this.copied.emit(true))`, `.catch(() => this.copied.emit(false))`.

### Behavior

- No internal toast or UI — emit and let the parent decide
- Works on any element (button, span, icon)
- `false` emitted on clipboard permission denial

### What you'll learn

The Clipboard API is async. The directive emits the result — it does not decide how to present it. This is "emit from outputs, not side effects."

---

## Directive 6: `appTooltip`

**Concept:** Renderer2, dynamic element creation, positioning

### Task

Show a tooltip on hover. The tooltip text comes from `tooltipText = input.required<string>()`. The tooltip `<div>` is created via `Renderer2.createElement`, appended to `document.body`, positioned absolutely relative to the host element using `getBoundingClientRect()`, and removed on `mouseleave`.

```ts
host: {
  '(mouseenter)'
:
  'show()',
    '(mouseleave)'
:
  'hide()'
}
```

Add `role="tooltip"` and `aria-describedby` for accessibility.

### What you'll learn

This is the case where `Renderer2` is genuinely required — you're creating a DOM element imperatively and appending it outside the component tree. Appending to `body` avoids overflow/clip issues from parent containers.

---

## Directive 7: `appAutoFocus`

**Concept:** `afterNextRender`, `ElementRef`

### Task

Auto-focus the host element when the component mounts. Use `afterNextRender` — not `ngAfterViewInit` — because it runs after the first render is complete.

```ts
constructor()
{
  afterNextRender(() => {
    inject(ElementRef<HTMLElement>).nativeElement.focus();
  });
}
```

Optional: `shouldFocus = input<boolean>(true)` — skip focus if false.

Also add a `FocusStatus` directive (tracks focused/unfocused via `(focus)`/`(blur)` host listeners, exposed with `exportAs`) and compose it with `appAutoFocus` via `hostDirectives` so the demo can show a live focus indicator.

### What you'll learn

`afterNextRender` is the v17+ replacement for the `ngAfterViewInit` + `setTimeout` hack. It fires once after the DOM is painted — guaranteed safe for focus operations.

---

## Directive 8: `appHighlight`

**Concept:** `effect()`, computed font contrast, `host` style bindings

**Already implemented** — add one improvement: if `appHighlight` is a signal input, use `effect()` to react to changes instead of relying on `onMouseEnter` re-reading the value:

```ts
constructor()
{
  effect(() => {
    // precompute derived values when input changes
    this._resolvedColor = this.appHighlight() || this.defaultColor() || 'yellow';
  });
}
```

### What you'll learn

`effect()` runs whenever any signal it reads changes. Use it for derived state that depends on inputs — it replaces `ngOnChanges` in signal-based directives.

---

## Directive 9: `appPermission`

**Concept:** Structural directive, `ViewContainerRef`, `TemplateRef`

### The Problem

`*ngIf` doesn't know about user roles. You want `*appPermission="'admin'"` to show/hide elements based on the current user's permissions — declaratively, in the template.

### Task

Inject `ViewContainerRef`, `TemplateRef`, and a simple `AuthService` mock. Accept `appPermission = input.required<string>()`. Use `effect()` to react to permission changes — clear the container and conditionally render the template.

Usage in template:

```html

<button *appPermission="'admin'">Delete</button>
```

This desugars to:

```html

<ng-template [appPermission]="'admin'">
  <button>Delete</button>
</ng-template>
```

### What you'll learn

`*directive` is syntactic sugar for `<ng-template [directive]>`. The `TemplateRef` is the template content. `ViewContainerRef.createEmbeddedView(tmpl)` renders it; `vcr.clear()` removes it. `effect()` re-evaluates whenever `appPermission()` or the auth state changes.

---

## Directive 10: `appTrapFocus`

**Concept:** Keyboard event handling, `querySelectorAll`, focus management

### Task

Cycle `Tab` and `Shift+Tab` within a container — required for accessible modals (WCAG 2.4.3).

```ts
host: {
  '(keydown)'
:
  'onKeydown($event)'
}
```

`onKeydown(event: KeyboardEvent)`:

1. If key is not `Tab`, return
2. `querySelectorAll` all focusable elements inside the host: `'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'`
3. On `Tab`: if focus is on last element, move to first and `preventDefault()`
4. On `Shift+Tab`: if focus is on first element, move to last and `preventDefault()`

### What you'll learn

Focus trapping is a WCAG requirement for modal dialogs. The directive queries focusable descendants and wraps Tab navigation at the boundaries. No Renderer2 needed — `focus()` called directly on `HTMLElement` is not a DOM mutation, it's a method call.

---

## Directive 11: `appLongPress`

**Concept:** `fromEvent`, `switchMap`, `timer`, touch + mouse events

### Task

Emit a `longPress` output after the user holds for a configurable `threshold` (default 500ms). Cancel if the user releases early.

```ts
readonly
threshold = input<number>(500);
readonly
longPress = output<void>();
```

Using RxJS in the constructor — think about: what events start the press, what events cancel it, and which operator lets you cancel an in-flight timer when a new start arrives.

### What you'll learn

`switchMap` cancels the previous `timer` when a new `mousedown` arrives — if the user releases before the timer fires, `takeUntil(end$)` cancels it. This is the correct reactive pattern for "hold to trigger."

---

## Directive 12: `appAnimateOnScroll`

**Concept:** IntersectionObserver, CSS class toggle, fire-once vs repeat

### Task

Add a CSS class (e.g. `'visible'`) when the element scrolls into view. Accept two inputs:

- `animationClass = input<string>('visible')`
- `repeat = input<boolean>(false)` — if false, disconnect after first trigger; if true, remove the class when the element leaves and re-add on re-entry

### What you'll learn

Compare with `appLazyLoad`: same observer, different intent. `appLazyLoad` always disconnects after first hit. `appAnimateOnScroll` with `repeat: true` keeps the observer alive and toggles the class — the `intersecting` property on the entry tells you which direction the threshold was crossed.

---

## Directive 13: `appNumbersOnly`

**Concept:** Keyboard event filtering, clipboard paste interception

### Task

Block non-numeric keystrokes on an `<input>` element. Also intercept paste events and strip non-numeric characters before they reach the input value.

```ts
host: {
  '(keydown)'
:
  'onKey($event)',
    '(paste)'
:
  'onPaste($event)'
}
```

`onKey`: allow control keys (Backspace, Delete, Tab, arrows), block anything that isn't a digit.

`onPaste`: `event.preventDefault()`, read `event.clipboardData.getData('text')`, strip non-numeric chars, set the input value via `Renderer2.setProperty(el, 'value', cleaned)`.

### What you'll learn

Keyboard filtering is not sufficient alone — users can paste non-numeric content. The paste handler intercepts `ClipboardEvent`, reads the data, sanitizes it, and sets the value directly. `Renderer2.setProperty` is the correct way to set the `value` property of a native input from a directive.

---

## Directive 14: `appResizeObserver`

**Concept:** ResizeObserver API, element-level size tracking

### The Problem

`window.resize` tells you the viewport size. `ResizeObserver` tells you when a *specific element's* size changes — regardless of whether the viewport changed. Use this for components that adapt their layout based on their own width, not the page width.

### Task

```ts
readonly
resize = output<{ width: number; height: number }>();
```

Create a `ResizeObserver` in the constructor, observe the host element, emit dimensions on each entry, and disconnect on destroy.

### Behavior

- Emits on first observation (initial size)
- Emits on every size change (window resize, parent layout change, dynamic content)
- Consumer can use this to swap between compact and full layouts

### What you'll learn

`ResizeObserver` is the modern replacement for listening to `window.resize` and manually querying element sizes. `DestroyRef.onDestroy` is the v17+ way to register cleanup logic without implementing `ngOnDestroy`.

---

## Directive 15: Composition Challenge — `hostDirectives`

**Concept:** Directive Composition API, behavior bundling

### The Problem

A `<button>` needs to be debounce-protected AND copy text on click. Without `hostDirectives`, you'd apply both directives manually in the template every time. With `hostDirectives`, you compose them once on a `CopyButtonComponent`.

### Task

```ts

@Component({
  selector: 'app-copy-button',
  hostDirectives: [
    {
      directive: DebounceClick,
      inputs: ['timeDelay'],
      outputs: ['btnClick']
    },
    {
      directive: CopyToClipboard,
      inputs: ['textToCopy'],
      outputs: ['copied']
    }
  ],
  template: `<ng-content />`
})
export class CopyButtonComponent {
}
```

Usage:

```html

<app-copy-button
  textToCopy="Hello World"
  [timeDelay]="500"
  (copied)="onCopied($event)">
  Copy
</app-copy-button>
```

### Behavior

- `textToCopy` and `timeDelay` are inputs on the component — delegated to their respective directives
- `copied` output fires from `CopyToClipboard` through the component
- The component template is just `<ng-content />` — all behavior is in the composed directives
- Both directives are independently reusable on their own

### What you'll learn

`hostDirectives` applies directives to the component's **host element**. Angular Material uses this to compose focus management, ripple effects, and ARIA handling onto `MatButton` without the component itself implementing any of that logic. The `inputs`/`outputs` arrays in `hostDirectives` explicitly opt-in which API is exposed — anything not listed is internal.

**Aliasing inputs and outputs:** You can rename the exposed API using `'originalName: aliasName'` syntax in the `inputs`/`outputs` arrays. This lets the component present a cleaner public API without being bound to the directive's internal naming:

```ts
hostDirectives: [
  {
    directive: DebounceClick,
    inputs: ['timeDelay: delay'],   // consumer uses [delay], not [timeDelay]
    outputs: ['btnClick: click']     // consumer uses (click), not (btnClick)
  }
]
```

**Directive-on-directive composition:** `hostDirectives` works on directives too, not just components. If two directives always travel together, compose them into a third directive first — then the component only references the composed one. This is how Angular Material actually layers its behaviour:

```ts
// Step 1 — bundle the two behaviours into a directive
@Directive({
  hostDirectives: [
    {directive: DebounceClick, inputs: ['timeDelay'], outputs: ['btnClick']},
    {directive: CopyToClipboard, inputs: ['textToCopy'], outputs: ['copied']}
  ]
})
export class InteractiveCopy {
}

// Step 2 — component delegates entirely to the bundle
@Component({
  selector: 'app-copy-button',
  hostDirectives: [InteractiveCopy],
  template: `<ng-content />`
})
export class CopyButtonComponent {
}
```

`CopyButtonComponent` now has no knowledge of `DebounceClick` or `CopyToClipboard` directly. The composition chain is transitive — Angular resolves all host bindings from every level and applies them to the same host element.

This is composition over inheritance at the directive level — the most Angular-native way to share behavior.

---

## Directive 16: `appTypedIf` — Template Type Guards

**Concept:** `ngTemplateGuard_*`, `ngTemplateContextGuard`, generic structural directive, compile-time type narrowing

### The Problem

`*ngIf="user; as u"` still types `u` as `User | null` inside the block — the template type checker doesn't know the falsy branch is unreachable. You want `u` to be `User` inside the block, catching property access errors at compile time.

### Task

Build a generic structural directive that renders its template only when the value is truthy, and provides it as `$implicit` in the context. Then add the two static guards that teach the template type checker to narrow correctly.

**Context interface** (define outside the class):

```ts
export interface TypedIfContext<T> {
  $implicit: T;
  appTypedIf: T;
}
```

**Scaffold:**

```ts

@Directive({selector: '[appTypedIf]'})
export class TypedIf<T> {
  private readonly vcr = inject(ViewContainerRef);
  private readonly tmpl = inject(TemplateRef<TypedIfContext<T>>);

  readonly appTypedIf = input.required<T | null | undefined>();

  // TODO 1: static ngTemplateGuard_appTypedIf
  //   — signals to the template type checker how to narrow
  //     the bound expression inside the template block
  //   — use the 'binding' literal form (same mechanism as *ngIf)

  // TODO 2: static ngTemplateContextGuard
  //   — tells the type checker what shape the context object is
  //   — must be generic so $implicit resolves to T, not unknown

  constructor() {
    effect(() => {
      // TODO 3: clear the view container, then conditionally
      //   createEmbeddedView with the correct context object
    });
  }
}
```

**Usage in template:**

```html
<!-- u is typed as User — not User | null -->
<p *appTypedIf="user; let u">{{ u.name }}</p>

<!-- named binding form -->
<p *appTypedIf="user; let u = appTypedIf">{{ u.email }}</p>
```

### Behavior

- Nothing rendered when the value is `null`, `undefined`, or any other falsy value
- Inside the block, the bound variable is the narrowed `T` — no `| null`
- Template compiler errors if you access a property that doesn't exist on `T`
- Reacts to signal changes — if the input transitions from `null` → value → `null`, the view is created and destroyed accordingly

### What you'll learn

`ngTemplateGuard_appTypedIf: 'binding'` is a static property (not a method) that tells the template type checker: "treat the expression bound to `appTypedIf` as if it were asserted truthy inside the template." The literal `'binding'` is a special token Angular recognises — it mirrors exactly what `*ngIf` does internally.

`ngTemplateContextGuard<T>` is a static method that narrows the `ctx: unknown` parameter to your typed context interface. It must be generic so the `T` from the directive class flows into the context type — without this, `let-u` would resolve to `unknown`.

Together they give you two layers of type safety: the input expression is narrowed before the template renders, and the context variables are fully typed once it does.

---

## Directive 17: `appAsync` — Typed Async Structural Directive

**Concept:** `ngTemplateContextGuard`, generic `Observable<T>` structural directive, loading/error state management

### The Problem

The `async` pipe unwraps `Observable<T>` but gives you no loading state, no error state, and forces awkward `*ngIf="data$ | async; as data"` syntax. A structural directive can handle subscription, teardown, and state in one place — and expose a fully typed context to the template.

### Task

Build a generic structural directive that accepts an `Observable<T>` input, subscribes to it, and exposes three context variables to the embedded template: the current value, a loading flag, and any error.

**Context interface** (define outside the class):

```ts
export interface AsyncContext<T> {
  $implicit: T | null;
  loading: boolean;
  error: unknown;
}
```

**Scaffold:**

```ts

@Directive({selector: '[appAsync]'})
export class Async<T> {
  private readonly vcr = inject(ViewContainerRef);
  private readonly tmpl = inject(TemplateRef<AsyncContext<T>>);

  readonly appAsync = input.required<Observable<T>>();

  // TODO 1: static ngTemplateContextGuard
  //   — generic method so T flows from the Observable<T> input
  //     into the context type the template sees

  constructor() {
    // TODO 2: use toObservable(this.appAsync) to react when the
    //   input Observable itself changes (e.g. bound to a different stream)

    // TODO 3: switchMap into the new Observable, tracking three states:
    //   - on subscribe:  loading = true,  value = null,  error = null
    //   - on next(value): loading = false, value = value, error = null
    //   - on error(e):    loading = false, value = null,  error = e

    // TODO 4: createEmbeddedView once, then update the view's context
    //   object in place (do NOT clear + recreate on every emission)

    // TODO 5: takeUntilDestroyed() for cleanup
  }
}
```

**Usage in template:**

```html

<ng-container *appAsync="users$; let users; let loading = loading; let err = error">
  @if (loading) {
  <p>Loading…</p>
  } @else if (err) {
  <p>Error: {{ err }}</p>
  } @else {
  @for (u of users; track u.id) {
  <p>{{ u.name }}</p>
  }
  }
</ng-container>
```

### Behavior

- Renders the template immediately (loading state), then updates the context in place as emissions arrive
- Switching the bound `Observable` (new reference on input) cancels the previous subscription — no double subscriptions
- `error` is populated and `loading` set to `false` on stream error — the template stays rendered so the error is visible
- Cleaned up automatically on directive destroy

### What you'll learn

`ngTemplateContextGuard` here is purely about flowing the generic `T` from `Observable<T>` into the context type. There is no input narrowing (no `ngTemplateGuard_*` needed) — the value can legitimately be `null` while loading. The guard just ensures `$implicit` resolves to `T | null`, not `unknown`.

The key implementation insight is TODO 4: you create the view **once** and mutate its context object directly via `viewRef.context.xxx = value`. This avoids destroying and re-creating the DOM on every emission — only call `createEmbeddedView` once, then patch the context.

`toObservable(this.appAsync)` + `switchMap` handles the case where the parent swaps the bound Observable — `switchMap` automatically unsubscribes from the old one.

---

## Directive 18: `appExitConfirm` — Browser-Level Exit Guard

**Concept:** `beforeunload`, `window` host listener, `CanDeactivate` complement

### The Problem

`CanDeactivateFn` protects against in-app navigation — the Angular router intercepts the route change and asks the guard. But it fires for nothing when the user closes the tab, hits refresh, or follows an external link. The browser handles those events directly; the router never gets involved.

`appExitConfirm` fills that gap by listening to `window:beforeunload` and prompting the browser's native "Leave site?" dialog when the form is dirty.

### The two-layer model

| Event                               | Who intercepts | How                                       |
|-------------------------------------|----------------|-------------------------------------------|
| In-app route change                 | Angular router | `CanDeactivateFn` checks `form.dirty()`   |
| Tab close / refresh / external link | Browser        | `beforeunload` + `event.preventDefault()` |

Neither replaces the other. Production forms need both.

### Task

```ts

@Directive({selector: '[appExitConfirm]'})
export class ExitConfirm {
  readonly dirty = input.required<boolean>();

  // TODO: listen to window:beforeunload via the host object
  //   — call event.preventDefault() when dirty() is true
  //   — modern browsers show their own "Leave site?" dialog;
  //     you do not control the message text
  //   — hint: '(window:beforeunload)': 'onBeforeUnload($event)'
}
```

Usage:

```html

<form [appExitConfirm]="form.dirty()">
  ...
</form>
```

Or with the full `CanDeactivate` pairing:

```ts
// route config
{
  path: 'edit',
    component
:
  EditComponent,
    canDeactivate
:
  [exitConfirmGuard]   // in-app navigation
}
```

```html
<!-- component template -->
<form [appExitConfirm]="form.dirty()"> <!-- browser-level exit -->
  ...
</form>
```

### Behavior

- No dialog when `dirty` is `false` — navigation proceeds normally
- When `dirty` is `true` and the user tries to close the tab or refresh, the browser shows its native confirmation dialog
- Reacts to `dirty` signal changes — if the form becomes clean (saved), the guard deactivates without any re-subscription or manual teardown
- The `window:beforeunload` listener is automatically removed when the directive is destroyed (Angular's `host` binding handles this)

### What you'll learn

`(window:beforeunload)` in the `host` object registers a window-level event listener scoped to the directive's lifetime — the same mechanism as `(document:click)` in `appClickOutside`. Angular removes it on destroy automatically, just like a host-element listener.

`event.preventDefault()` is the modern spec-compliant way to trigger the browser dialog. The old `event.returnValue = ''` pattern still works in some browsers but is deprecated — avoid it.

The key design point: `dirty` is a plain `boolean` input, not a `FormGroup` reference. The directive does not know what kind of form it is protecting — reactive, signal-based, or custom. The component decides what "dirty" means and passes the result in. This is the single-responsibility principle applied to the host binding layer.

---

## Acceptance Criteria

- [ ] All 18 directives implemented and demoed
- [ ] No `@HostListener` / `@HostBinding` — use `host` object
- [ ] No constructor injection — use `inject()`
- [ ] No `@Input()` / `@Output()` — use `input()` / `output()`
- [ ] `Renderer2` used only for imperative DOM mutations (not for `host` bindings)
- [ ] `effect()` used in at least one directive reacting to a signal input
- [ ] All Observers (`IntersectionObserver`, `ResizeObserver`) disconnected via `DestroyRef`
- [ ] `appPermission` uses `ViewContainerRef.createEmbeddedView` — true structural directive
- [ ] `appTrapFocus` passes keyboard navigation between first/last focusable element
- [ ] `hostDirectives` used in directive 15 — inputs and outputs explicitly listed
- [ ] `appTypedIf` has both `ngTemplateGuard_appTypedIf: 'binding'` and `static ngTemplateContextGuard<T>` — template type errors visible in IDE
- [ ] `appAsync` has `static ngTemplateContextGuard<T>` — `$implicit` resolves to `T | null`, not `unknown`
- [ ] `appAsync` creates the view once and patches context in place — no recreate on each emission
- [ ] `appExitConfirm` uses `(window:beforeunload)` in `host` — no manual `addEventListener`
- [ ] `appExitConfirm` does NOT fire the dialog when `dirty` is `false`
- [ ] Demo page showcases all 18 with interactive examples

---

## Pattern Quick Reference

| Directive            | Key API                                                                               |
|----------------------|---------------------------------------------------------------------------------------|
| `appLazyLoad`        | `IntersectionObserver`, `disconnect()` on first hit                                   |
| `appDebounceClick`   | `Subject` + `debounce`, `outputFromObservable`                                        |
| `appInfiniteScroll`  | `throttleTime`, `afterNextRender`, scroll threshold                                   |
| `appClickOutside`    | `document:click` in `host`, `el.contains(target)`                                     |
| `appCopyToClipboard` | `navigator.clipboard.writeText`, emit result                                          |
| `appTooltip`         | `Renderer2.createElement`, `body.appendChild`, `getBoundingClientRect`                |
| `appAutoFocus`       | `afterNextRender`, `el.focus()`                                                       |
| `appHighlight`       | `host` style bindings, `effect()` for input changes                                   |
| `appPermission`      | `ViewContainerRef`, `TemplateRef`, `createEmbeddedView`                               |
| `appTrapFocus`       | `querySelectorAll` focusables, wrap Tab at boundary                                   |
| `appLongPress`       | `switchMap` + `timer` + `takeUntil`                                                   |
| `appAnimateOnScroll` | `IntersectionObserver`, class toggle, repeat option                                   |
| `appNumbersOnly`     | `keydown` filter, `paste` intercept, `Renderer2.setProperty`                          |
| `appResizeObserver`  | `ResizeObserver`, `DestroyRef.onDestroy`                                              |
| Composition          | `hostDirectives`, explicit `inputs`/`outputs`                                         |
| `appTypedIf`         | `ngTemplateGuard_*: 'binding'`, `ngTemplateContextGuard<T>`, `ViewContainerRef`       |
| `appAsync`           | `ngTemplateContextGuard<T>`, `toObservable` + `switchMap`, patch context in place     |
| `appExitConfirm`     | `window:beforeunload` in `host`, `event.preventDefault()`, `CanDeactivate` complement |

---

## Resources

- [Directive Composition API — Angular Docs](https://angular.dev/guide/directives/directive-composition-api)
- [Structural Directives — Angular Docs](https://angular.dev/guide/directives/structural-directives)
- [Host Directives: decomposition unleashed — angularspace.com](https://www.angularspace.com/host-directives-decomposition-unleashed/)
- [IntersectionObserver API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [ResizeObserver API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Clipboard API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [WCAG 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order)
- [DestroyRef — Angular Docs](https://angular.dev/api/core/DestroyRef)
- [afterNextRender — Angular Docs](https://angular.dev/api/core/afterNextRender)
- [Template type checking — Angular Docs](https://angular.dev/guide/templates/template-typecheck)
- [Structural Directives type checking — Angular Docs](https://angular.dev/guide/directives/structural-directives#improving-template-type-checking-for-custom-directives)
- [Typing the Context Object in Structural Directives — Netanel Basal](https://medium.com/netanelbasal/typing-the-context-object-in-angular-structural-directives-d0ad1c0474a)
- [beforeunload event — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
