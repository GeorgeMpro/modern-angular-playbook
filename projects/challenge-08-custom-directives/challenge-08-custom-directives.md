# Challenge #8: Custom Directives Library - Build Your Utility Belt

**Difficulty:** Medium
**Time Estimate:** 4-5 hours
**Angular Version:** 20+
**Focus:** Reusable directives for common patterns

---

## Learning Objectives

- Create structural directives
- Create attribute directives (behavior modification)
- Use the `host` object for host bindings and listeners
- Use `input()` and `output()` signal functions
- Handle DOM manipulation safely with `Renderer2`
- Create composable, reusable directives
- Clean up with `DestroyRef` and `takeUntilDestroyed`
- Intercept keyboard and clipboard events for input filtering
- Implement focus trapping for accessible modals/dialogs
- Work with touch events for mobile interactions

---

## The Challenge

Build **13 practical directives** you'll actually use:

### 1. **appLazyLoad** - Lazy Load Images

Load images only when visible in viewport (Intersection Observer)

### 2. **appDebounceClick** - Prevent Double Clicks

Debounce button clicks to prevent duplicate submissions

### 3. **appInfiniteScroll** - Infinite Scroll

Trigger event when scrolling near bottom

### 4. **appClickOutside** - Click Outside Detection

Detect clicks outside an element (dropdowns, modals)

### 5. **appCopyToClipboard** - Copy to Clipboard

Click to copy text to clipboard with feedback

### 6. **appTooltip** - Accessible Tooltip

Show tooltip on hover with proper positioning

### 7. **appAutoFocus** - Auto Focus

Auto-focus input on component load

### 8. **appHighlight** - Text Highlighter

Highlight search terms in text

### 9. **appPermission** - Permission-Based Rendering

Show/hide elements based on user permissions (structural directive)

### 10. **appTrapFocus** - Focus Trap

Cycle Tab/Shift+Tab within a container — required for accessible modals and dialogs (WCAG)

### 11. **appLongPress** - Long Press Detection

Detect long press on mouse and touch devices with configurable threshold

### 12. **appAnimateOnScroll** - Animate on Enter Viewport

Add a CSS class when an element scrolls into view (IntersectionObserver — fire-once vs. repeat)

### 13. **appNumbersOnly** - Input Character Filter

Block non-numeric keystrokes and filter pasted content on `<input>` elements

---

## Acceptance Criteria

- [ ] All 13 directives implemented
- [ ] No `@HostListener` / `@HostBinding` — use `host` object
- [ ] No constructor injection — use `inject()`
- [ ] No `@Input()` / `@Output()` decorators — use `input()` / `output()`
- [ ] No `standalone: true` in decorators
- [ ] DOM manipulation uses `Renderer2`
- [ ] Memory leaks prevented (`takeUntilDestroyed`, `ngOnDestroy` where needed)
- [ ] Accessibility considered (ARIA attributes, keyboard events)
- [ ] Demo page showcasing all directives

---

## Best Practices

1. **Use `Renderer2`** — never manipulate the DOM directly
2. **Use `host` object** — not `@HostListener` / `@HostBinding`
3. **Use `effect()`** — react to signal input changes instead of `ngOnChanges`
4. **Clean up observers** — `IntersectionObserver`, event listeners on destroy
5. **Emit from outputs, not side effects** — let the consumer decide what to do (e.g. `copied` output, not internal toast)
6. **Accessibility** — `role`, `aria-*` attributes, keyboard support

---

## Resources

- [Angular Directives Guide](https://angular.dev/guide/directives)
- [Attribute Directives](https://angular.dev/guide/directives/attribute-directives)
- [Structural Directives](https://angular.dev/guide/directives/structural-directives)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Renderer2 API](https://angular.dev/api/core/Renderer2)
- [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [WCAG 2.1 — Focus Management](https://www.w3.org/WAI/WCAG21/Understanding/focus-order)
- [DestroyRef](https://angular.dev/api/core/DestroyRef)
