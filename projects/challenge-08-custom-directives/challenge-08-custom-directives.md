# Challenge #8: Custom Directives Library

**Difficulty:** Medium
**Angular Version:** 22+
**Focus:** Attribute directives, structural directives, Directive Composition API, browser APIs

---

## Context

Directives are Angular's mechanism for attaching reusable behavior to DOM elements. A well-built directive library eliminates copy-paste logic across components and is one of the clearest signals of senior-level Angular work — every interview that asks "how do you share behavior across components without inheritance?" is answered here.

This challenge builds 15 directives: 13 practical utilities and 2 that teach the Directive Composition API.

---

## Core Rules (apply to every directive)

- No `@HostListener` / `@HostBinding` — use the `host` object in `@Directive`
- No constructor injection — use `inject()`
- No `@Input()` / `@Output()` decorators — use `input()` / `output()`
- No `standalone: true` — v22 default
- `Renderer2` for imperative DOM mutations (adding classes, creating elements, setting attributes via TypeScript). Not needed for `host` style/class bindings — those are declarative and go directly in the `host` object.
- `effect()` to react to signal input changes — not `ngOnChanges`
- All Observers (`IntersectionObserver`, `ResizeObserver`, `MutationObserver`) disconnected on destroy via `inject(DestroyRef).onDestroy(() => observer.disconnect())`

---

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

`IntersectionObserver` fires a callback when the observed element crosses a visibility threshold. `disconnect()` after the first hit makes it fire-once — unlike `appAnimateOnScroll` (directive 12) which can fire repeatedly.

---

## Directive 2: `appDebounceClick`

**Concept:** `outputFromObservable`, `Subject`, `debounce`

### Task

Debounce button clicks to prevent duplicate submissions. Emits a debounced `btnClick` output instead of the native click event.

```ts
readonly timeDelay = input<number>(300);
private readonly clickListener$ = new Subject<void>();
readonly btnClick = outputFromObservable(
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
readonly clickOutside = output<void>();
private readonly el = inject(ElementRef<HTMLElement>);
```

In `host`:
```ts
host: { '(document:click)': 'onDocClick($event)' }
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
readonly textToCopy = input.required<string>();
readonly copied     = output<boolean>(); // true = success, false = failed
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
  '(mouseenter)': 'show()',
  '(mouseleave)': 'hide()'
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
constructor() {
  afterNextRender(() => {
    inject(ElementRef<HTMLElement>).nativeElement.focus();
  });
}
```

Optional: `shouldFocus = input<boolean>(true)` — skip focus if false.

### What you'll learn

`afterNextRender` is the v17+ replacement for the `ngAfterViewInit` + `setTimeout` hack. It fires once after the DOM is painted — guaranteed safe for focus operations.

---

## Directive 8: `appHighlight`

**Concept:** `effect()`, computed font contrast, `host` style bindings

**Already implemented** — add one improvement: if `appHighlight` is a signal input, use `effect()` to react to changes instead of relying on `onMouseEnter` re-reading the value:

```ts
constructor() {
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

```ts
@Directive({ selector: '[appPermission]' })
export class Permission {
  private readonly vcr  = inject(ViewContainerRef);
  private readonly tmpl = inject(TemplateRef);
  private readonly authService = inject(AuthService); // inject a simple mock

  readonly appPermission = input.required<string>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.authService.hasPermission(this.appPermission())) {
        this.vcr.createEmbeddedView(this.tmpl);
      }
    });
  }
}
```

Usage in template:
```html
<button *appPermission="'admin'">Delete</button>
```

This desugars to:
```html
<ng-template [appPermission]="'admin'"><button>Delete</button></ng-template>
```

### What you'll learn

`*directive` is syntactic sugar for `<ng-template [directive]>`. The `TemplateRef` is the template content. `ViewContainerRef.createEmbeddedView(tmpl)` renders it; `vcr.clear()` removes it. `effect()` re-evaluates whenever `appPermission()` or the auth state changes.

---

## Directive 10: `appTrapFocus`

**Concept:** Keyboard event handling, `querySelectorAll`, focus management

### Task

Cycle `Tab` and `Shift+Tab` within a container — required for accessible modals (WCAG 2.4.3).

```ts
host: { '(keydown)': 'onKeydown($event)' }
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
readonly threshold  = input<number>(500);
readonly longPress  = output<void>();
```

Using RxJS:
```ts
constructor() {
  const el = inject(ElementRef<HTMLElement>).nativeElement;
  const start$ = merge(fromEvent(el, 'mousedown'), fromEvent(el, 'touchstart'));
  const end$   = merge(fromEvent(el, 'mouseup'), fromEvent(el, 'touchend'), fromEvent(el, 'mouseleave'));

  start$.pipe(
    switchMap(() => timer(this.threshold()).pipe(takeUntil(end$))),
    takeUntilDestroyed()
  ).subscribe(() => this.longPress.emit());
}
```

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
  '(keydown)': 'onKey($event)',
  '(paste)':   'onPaste($event)'
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
readonly resize = output<{ width: number; height: number }>();
```

Create a `ResizeObserver` in the constructor, observe `inject(ElementRef).nativeElement`. On each entry, emit `{ width: entry.contentRect.width, height: entry.contentRect.height }`. Disconnect on `DestroyRef`.

```ts
constructor() {
  const el  = inject(ElementRef<HTMLElement>).nativeElement;
  const obs = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    this.resize.emit({ width, height });
  });
  obs.observe(el);
  inject(DestroyRef).onDestroy(() => obs.disconnect());
}
```

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
      inputs:  ['timeDelay'],
      outputs: ['btnClick']
    },
    {
      directive: CopyToClipboard,
      inputs:  ['textToCopy'],
      outputs: ['copied']
    }
  ],
  template: `<ng-content />`
})
export class CopyButtonComponent { }
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

This is composition over inheritance at the directive level — the most Angular-native way to share behavior.

---

## Acceptance Criteria

- [ ] All 15 directives implemented and demoed
- [ ] No `@HostListener` / `@HostBinding` — use `host` object
- [ ] No constructor injection — use `inject()`
- [ ] No `@Input()` / `@Output()` — use `input()` / `output()`
- [ ] `Renderer2` used only for imperative DOM mutations (not for `host` bindings)
- [ ] `effect()` used in at least one directive reacting to a signal input
- [ ] All Observers (`IntersectionObserver`, `ResizeObserver`) disconnected via `DestroyRef`
- [ ] `appPermission` uses `ViewContainerRef.createEmbeddedView` — true structural directive
- [ ] `appTrapFocus` passes keyboard navigation between first/last focusable element
- [ ] `hostDirectives` used in directive 15 — inputs and outputs explicitly listed
- [ ] Demo page showcases all 15 with interactive examples

---

## Pattern Quick Reference

| Directive | Key API |
|---|---|
| `appLazyLoad` | `IntersectionObserver`, `disconnect()` on first hit |
| `appDebounceClick` | `Subject` + `debounce`, `outputFromObservable` |
| `appInfiniteScroll` | `throttleTime`, `afterNextRender`, scroll threshold |
| `appClickOutside` | `document:click` in `host`, `el.contains(target)` |
| `appCopyToClipboard` | `navigator.clipboard.writeText`, emit result |
| `appTooltip` | `Renderer2.createElement`, `body.appendChild`, `getBoundingClientRect` |
| `appAutoFocus` | `afterNextRender`, `el.focus()` |
| `appHighlight` | `host` style bindings, `effect()` for input changes |
| `appPermission` | `ViewContainerRef`, `TemplateRef`, `createEmbeddedView` |
| `appTrapFocus` | `querySelectorAll` focusables, wrap Tab at boundary |
| `appLongPress` | `switchMap` + `timer` + `takeUntil` |
| `appAnimateOnScroll` | `IntersectionObserver`, class toggle, repeat option |
| `appNumbersOnly` | `keydown` filter, `paste` intercept, `Renderer2.setProperty` |
| `appResizeObserver` | `ResizeObserver`, `DestroyRef.onDestroy` |
| Composition | `hostDirectives`, explicit `inputs`/`outputs` |

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
