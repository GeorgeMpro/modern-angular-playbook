# ng-template Challenge #2: Configurable Modal

**Difficulty:** Beginner–Medium
**Angular Version:** 22+
**Focus:** `TemplateRef` as input, `ngTemplateOutlet`, reusable shell components

---

## The Problem

A `ModalComponent` that hardcodes its header, body, and footer is useless as a reusable component — every use case would need a new modal. The shell (backdrop, positioning, animation, close logic) is always the same. The content always differs. These two concerns should live in different places.

---

## Task

Build a `ModalComponent` that is a pure shell — it owns visibility state and layout, nothing else. The parent provides the content.

### ModalComponent

- Signal `isOpen = signal(false)` with `open()` and `close()` methods
- Three required `TemplateRef` inputs: `headerTemplate`, `bodyTemplate`, `footerTemplate`
- Uses `ngTemplateOutlet` to render each in the correct region
- No hardcoded text, no business logic

```ts
readonly headerTemplate = input.required<TemplateRef<void>>();
readonly bodyTemplate   = input.required<TemplateRef<void>>();
readonly footerTemplate = input.required<TemplateRef<void>>();
```

```html
<div class="modal-panel" @if (isOpen())>
  <div class="modal-header">
    <ng-container [ngTemplateOutlet]="headerTemplate()" />
  </div>
  <div class="modal-body">
    <ng-container [ngTemplateOutlet]="bodyTemplate()" />
  </div>
  <div class="modal-footer">
    <ng-container [ngTemplateOutlet]="footerTemplate()" />
  </div>
</div>
```

### Parent — Two modal instances

**Modal 1: Confirm Deletion**

```html
<ng-template #confirmHeader><h2>Confirm Deletion</h2></ng-template>
<ng-template #confirmBody><p>This action cannot be undone.</p></ng-template>
<ng-template #confirmFooter>
  <button (click)="deleteModal.close()">Cancel</button>
  <button class="danger" (click)="onDelete()">Yes, delete</button>
</ng-template>

<app-modal #deleteModal
  [headerTemplate]="confirmHeader"
  [bodyTemplate]="confirmBody"
  [footerTemplate]="confirmFooter" />
```

**Modal 2: User Login**

```html
<ng-template #loginHeader><h2>User Login</h2></ng-template>
<ng-template #loginBody>
  <input placeholder="Username" />
  <input type="password" placeholder="Password" />
</ng-template>
<ng-template #loginFooter>
  <button (click)="onLogin()">Log In</button>
</ng-template>

<app-modal #loginModal
  [headerTemplate]="loginHeader"
  [bodyTemplate]="loginBody"
  [footerTemplate]="loginFooter" />
```

Two buttons open each modal independently.

### Behavior

- Both modals exist in the DOM simultaneously but only the open one is visible
- Closing one doesn't affect the other — each has its own `isOpen` signal
- The modal shell component has zero knowledge of "deletion" or "login"

### What you'll learn

`TemplateRef` as an `input()` is the explicit slot pattern — the parent hands a template reference directly to the child via property binding. The child renders it with `ngTemplateOutlet`. This is different from `contentChild()` (which queries projected content) — here the parent explicitly passes templates as data.

Think of `TemplateRef` as a function definition for UI: it's a recipe the child can execute whenever and wherever it wants, with `ngTemplateOutlet` as the call site.

### Hint

`<ng-template #confirmHeader>` defines the template. `[headerTemplate]="confirmHeader"` passes the `TemplateRef` object as an input. `[ngTemplateOutlet]="headerTemplate()"` executes it.

---

## Acceptance Criteria

- [ ] `ModalComponent` has no hardcoded content
- [ ] `TemplateRef<void>` — no `any`
- [ ] Each modal instance has independent visibility state
- [ ] Closing modal 1 does not affect modal 2
- [ ] Both modals can be open simultaneously (no global modal state)
