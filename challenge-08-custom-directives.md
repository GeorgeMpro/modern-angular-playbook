# Challenge #8: Custom Directives Library - Build Your Utility Belt

**Difficulty:** Medium
**Time Estimate:** 3-4 hours
**Focus:** Reusable directives for common patterns

---

## 🎯 Learning Objectives

- Create structural directives (like *ngIf)
- Create attribute directives (behavior modification)
- Use HostListener and HostBinding
- Implement directive inputs and outputs
- Handle DOM manipulation safely
- Create composable, reusable directives
- Build a library of production-ready utilities

---

## 📋 The Challenge

Build **10 practical directives** you'll actually use:

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

### 8. **appLet** - Structural Directive for Variables
Store template expression result in variable (like *ngIf; let x)

### 9. **appHighlight** - Text Highlighter
Highlight search terms in text

### 10. **appPermission** - Permission-Based Rendering
Show/hide elements based on user permissions

---

## 🏗️ Implementation Guide

### 1. Lazy Load Images Directive

```typescript
// directives/lazy-load.directive.ts
import { Directive, ElementRef, OnInit, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit {
  @Input() appLazyLoad!: string; // Image URL

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Set placeholder
    this.renderer.setAttribute(this.el.nativeElement, 'src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

    // Create Intersection Observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          observer.unobserve(this.el.nativeElement);
        }
      });
    });

    observer.observe(this.el.nativeElement);
  }

  private loadImage() {
    const img = this.el.nativeElement;

    // Show loading state
    this.renderer.addClass(img, 'loading');

    // Load image
    const tempImg = new Image();
    tempImg.src = this.appLazyLoad;

    tempImg.onload = () => {
      this.renderer.setAttribute(img, 'src', this.appLazyLoad);
      this.renderer.removeClass(img, 'loading');
      this.renderer.addClass(img, 'loaded');
    };

    tempImg.onerror = () => {
      this.renderer.addClass(img, 'error');
      this.renderer.setAttribute(img, 'src', '/assets/placeholder-error.png');
    };
  }
}
```

**Usage:**
```html
<img [appLazyLoad]="product.imageUrl" alt="Product" />

<!-- Loads image only when scrolled into view -->
```

---

### 2. Debounce Click Directive

```typescript
// directives/debounce-click.directive.ts
import { Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[appDebounceClick]',
  standalone: true
})
export class DebounceClickDirective implements OnDestroy {
  @Input() debounceTime = 500; // Default 500ms
  @Output() debounceClick = new EventEmitter<MouseEvent>();

  private clicks = new Subject<MouseEvent>();

  constructor() {
    this.clicks.pipe(
      debounceTime(this.debounceTime),
      takeUntilDestroyed()
    ).subscribe(event => this.debounceClick.emit(event));
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }

  ngOnDestroy() {
    this.clicks.complete();
  }
}
```

**Usage:**
```html
<button
  appDebounceClick
  [debounceTime]="1000"
  (debounceClick)="save()">
  Save (prevents double-click)
</button>
```

---

### 3. Infinite Scroll Directive

```typescript
// directives/infinite-scroll.directive.ts
import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective {
  @Input() scrollThreshold = 0.8; // Trigger at 80% scrolled
  @Output() scrollEnd = new EventEmitter<void>();

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    const threshold = scrollHeight * this.scrollThreshold;

    if (scrollPosition >= threshold) {
      this.scrollEnd.emit();
    }
  }
}
```

**Usage:**
```html
<div
  class="scrollable-list"
  appInfiniteScroll
  [scrollThreshold]="0.9"
  (scrollEnd)="loadMore()">
  <!-- List items -->
</div>
```

---

### 4. Click Outside Directive

```typescript
// directives/click-outside.directive.ts
import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
```

**Usage:**
```html
<div class="dropdown" appClickOutside (clickOutside)="closeDropdown()">
  <button (click)="toggleDropdown()">Open Menu</button>
  <ul *ngIf="isOpen">
    <li>Option 1</li>
    <li>Option 2</li>
  </ul>
</div>
```

---

### 5. Copy to Clipboard Directive

```typescript
// directives/copy-to-clipboard.directive.ts
import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true
})
export class CopyToClipboardDirective {
  @Input() appCopyToClipboard!: string;
  @Input() copySuccessMessage = 'Copied!';

  @HostListener('click')
  async onClick(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.appCopyToClipboard);
      this.showFeedback();
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      this.fallbackCopy();
    }
  }

  private showFeedback(): void {
    // You could use a toast service here
    console.log(this.copySuccessMessage);

    // Or show temporary tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = this.copySuccessMessage;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '4px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';

    document.body.appendChild(tooltip);

    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }

  private fallbackCopy(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.appCopyToClipboard;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    this.showFeedback();
  }
}
```

**Usage:**
```html
<button
  [appCopyToClipboard]="apiKey"
  copySuccessMessage="API Key copied!">
  Copy API Key
</button>
```

---

### 6. Tooltip Directive

```typescript
// directives/tooltip.directive.ts
import { Directive, ElementRef, HostListener, Input, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input() appTooltip!: string;
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipElement?: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.showTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideTooltip();
  }

  @HostListener('focus')
  onFocus(): void {
    this.showTooltip();
  }

  @HostListener('blur')
  onBlur(): void {
    this.hideTooltip();
  }

  private showTooltip(): void {
    if (this.tooltipElement) return;

    // Create tooltip element
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'tooltip');
    this.renderer.setProperty(this.tooltipElement, 'textContent', this.appTooltip);

    // Style tooltip
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'background', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', '#fff');
    this.renderer.setStyle(this.tooltipElement, 'padding', '6px 12px');
    this.renderer.setStyle(this.tooltipElement, 'borderRadius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'fontSize', '14px');
    this.renderer.setStyle(this.tooltipElement, 'zIndex', '9999');
    this.renderer.setStyle(this.tooltipElement, 'whiteSpace', 'nowrap');
    this.renderer.setStyle(this.tooltipElement, 'pointerEvents', 'none');

    // Append to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position tooltip
    this.positionTooltip();
  }

  private hideTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + 8;
        break;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  ngOnDestroy(): void {
    this.hideTooltip();
  }
}
```

**Usage:**
```html
<button appTooltip="This saves your data" tooltipPosition="top">
  Save
</button>
```

---

### 7. Auto Focus Directive

```typescript
// directives/auto-focus.directive.ts
import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  @Input() appAutoFocus = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.appAutoFocus) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      }, 0);
    }
  }
}
```

**Usage:**
```html
<input appAutoFocus type="text" placeholder="Auto-focused on load" />
```

---

### 8. Let Directive (Structural - Store Variable)

```typescript
// directives/let.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

interface LetContext<T> {
  appLet: T;
}

@Directive({
  selector: '[appLet]',
  standalone: true
})
export class LetDirective<T> {
  @Input()
  set appLet(value: T) {
    this.context.appLet = value;

    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef, this.context);
      this.hasView = true;
    }
  }

  private context: LetContext<T> = { appLet: undefined! };
  private hasView = false;

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<LetContext<T>>
  ) {}
}
```

**Usage:**
```html
<!-- Store expensive computation result -->
<div *appLet="(products$ | async) as products">
  <p>Count: {{ products.length }}</p>
  <div *ngFor="let product of products">
    {{ product.name }}
  </div>
</div>

<!-- Avoid calling function multiple times -->
<div *appLet="calculateTotal() as total">
  <p>Subtotal: {{ total * 0.8 }}</p>
  <p>Tax: {{ total * 0.2 }}</p>
  <p>Total: {{ total }}</p>
</div>
```

---

### 9. Highlight Text Directive

```typescript
// directives/highlight.directive.ts
import { Directive, ElementRef, Input, Renderer2, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective implements OnChanges {
  @Input() appHighlight!: string; // Search term
  @Input() highlightColor = 'yellow';

  private originalContent?: string;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appHighlight']) {
      this.highlight();
    }
  }

  private highlight(): void {
    const element = this.el.nativeElement;

    if (!this.originalContent) {
      this.originalContent = element.textContent;
    }

    if (!this.appHighlight) {
      element.innerHTML = this.originalContent;
      return;
    }

    const regex = new RegExp(this.escapeRegExp(this.appHighlight), 'gi');
    const highlighted = this.originalContent.replace(
      regex,
      match => `<mark style="background-color: ${this.highlightColor};">${match}</mark>`
    );

    element.innerHTML = highlighted;
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
```

**Usage:**
```html
<div [appHighlight]="searchTerm" highlightColor="yellow">
  Angular is a platform for building web applications.
</div>

<!-- If searchTerm = "angular", it highlights "Angular" -->
```

---

### 10. Permission Directive (Structural)

```typescript
// directives/permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionDirective implements OnInit {
  @Input() appPermission!: string | string[];

  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermission(): boolean {
    const permissions = Array.isArray(this.appPermission)
      ? this.appPermission
      : [this.appPermission];

    return permissions.some(permission =>
      this.authService.hasRole(permission)
    );
  }
}
```

**Usage:**
```html
<!-- Show only for admins -->
<button *appPermission="'admin'" (click)="deleteUser()">
  Delete User
</button>

<!-- Show for admin or moderator -->
<div *appPermission="['admin', 'moderator']">
  <h3>Moderation Panel</h3>
</div>
```

---

## 📦 Creating a Directives Module

```typescript
// directives/index.ts
export { LazyLoadDirective } from './lazy-load.directive';
export { DebounceClickDirective } from './debounce-click.directive';
export { InfiniteScrollDirective } from './infinite-scroll.directive';
export { ClickOutsideDirective } from './click-outside.directive';
export { CopyToClipboardDirective } from './copy-to-clipboard.directive';
export { TooltipDirective } from './tooltip.directive';
export { AutoFocusDirective } from './auto-focus.directive';
export { LetDirective } from './let.directive';
export { HighlightDirective } from './highlight.directive';
export { PermissionDirective } from './permission.directive';

// Import all at once:
import { Component } from '@angular/core';
import * as Directives from './directives';

@Component({
  imports: [
    Directives.LazyLoadDirective,
    Directives.DebounceClickDirective,
    // ... etc
  ]
})
export class MyComponent {}
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] All 10 directives implemented
- [ ] Each directive works independently
- [ ] Proper input/output bindings
- [ ] HostListener/HostBinding used correctly
- [ ] DOM manipulation uses Renderer2 (safe)
- [ ] Memory leaks prevented (cleanup on destroy)
- [ ] Directives are standalone
- [ ] TypeScript types are correct

### Should Have
- [ ] Documentation for each directive
- [ ] Usage examples
- [ ] Default values for inputs
- [ ] Error handling
- [ ] Accessibility considerations
- [ ] Browser compatibility

### Nice to Have
- [ ] Unit tests for each directive
- [ ] Demo page showcasing all directives
- [ ] NPM package published
- [ ] Storybook stories

---

## 🧪 Testing Directives

```typescript
// Example: Testing LazyLoad Directive
describe('LazyLoadDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let imgElement: HTMLImageElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    imgElement = fixture.nativeElement.querySelector('img');
  });

  it('should create placeholder initially', () => {
    fixture.detectChanges();
    expect(imgElement.src).toContain('data:image/gif');
  });

  it('should load image when in viewport', (done) => {
    // Mock IntersectionObserver
    const mockIntersectionObserver = jasmine.createSpy('IntersectionObserver');
    window.IntersectionObserver = mockIntersectionObserver;

    fixture.detectChanges();

    // Trigger intersection
    const callback = mockIntersectionObserver.calls.argsFor(0)[0];
    callback([{ isIntersecting: true }]);

    setTimeout(() => {
      expect(imgElement.src).toContain('test-image.jpg');
      done();
    }, 100);
  });
});
```

---

## 💡 Best Practices

1. **Always use Renderer2** - Never manipulate DOM directly
2. **Clean up in ngOnDestroy** - Remove event listeners, observers
3. **Use HostBinding/HostListener** - Better than manual event binding
4. **Make directives composable** - Multiple directives on same element
5. **Provide sensible defaults** - Optional inputs with good defaults
6. **Document thoroughly** - JSDoc comments for inputs/outputs
7. **Test edge cases** - Null values, rapid changes, destroy scenarios
8. **Consider accessibility** - ARIA attributes, keyboard support

---

## 📚 Resources

**Angular Directives:**
- [Angular Directives Guide](https://angular.dev/guide/directives)
- [Attribute Directives](https://angular.dev/guide/directives/attribute-directives)
- [Structural Directives](https://angular.dev/guide/directives/structural-directives)

**DOM APIs:**
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Renderer2 API](https://angular.dev/api/core/Renderer2)

---

**Build these once, use them forever. This is your Angular utility belt!**
