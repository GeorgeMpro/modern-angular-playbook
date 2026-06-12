# Challenge #13: Design Patterns in Angular & TypeScript

**Difficulty:** Medium–Hard
**Angular Version:** 22+
**Focus:** Component architecture patterns, Angular DI patterns, TypeScript type patterns

---

## Context

Challenge 12 was about knowing *which RxJS operator* to reach for.
Challenge 13 is about knowing *how to structure* — components, services, and types — so that code stays clean, reusable, and maintainable as it scales.

Each challenge is a focused exercise. The goal is not to build a feature — it's to practice the pattern in isolation so it becomes instinct.

---

## Project Structure

```
src/app/
├── shared/
│   └── models/
├── 01-smart-dumb/
├── 02-facade/
├── 03-command-pattern/
├── 04-injection-functions/
├── 05-context-provider/
├── 06-strategy-di/
├── 07-state-machine/
├── 08-typescript-types/
└── app.ts
```

---

## Challenge 1: Smart / Dumb Split

**Pattern:** Container / Presentational Components
**Concepts:** Input signals, output signals, input transform, single responsibility

### The Problem

You have a single component that fetches a list of products from an API, filters them by category, and renders the table. It does everything. It is impossible to reuse the table elsewhere.

### Task

Split it into two components:

- `ProductListContainer` — the *smart* component. Owns the HTTP call, owns the filter state, passes data down.
- `ProductListTable` — the *dumb* component. Receives `products` and `selectedCategory` as inputs. Emits `categoryChange` as an output. Knows nothing about HTTP or services.

Use the `transform` option on `input()` to normalize data at the boundary. Example: the container passes a raw API price as a string, the dumb component declares:

```ts
readonly price = input<number, string>(0, { transform: (v) => parseFloat(v) });
```

The table stores a `number` internally while accepting a `string` from the parent. Data normalization lives at the boundary, not inside the component's logic.

### Behavior

- The table component has zero `inject()` calls — no services, no router, nothing
- The container can be swapped for a different data source without touching the table
- The table can be dropped into any other page without modification
- At least one input uses `transform` for type normalization

### What you'll learn

The dumb component is infinitely reusable. The smart component is the only place side effects live. The `transform` option enforces that data arrives in the right shape — the component doesn't have to defensive-cast inside its logic.

### Hint

If a component has `inject(HttpClient)` and also has `@for` in its template, it's doing two jobs. One of those belongs in a child.

---

## Challenge 2: The Facade Pattern

**Pattern:** Facade
**Concepts:** Encapsulation, `asReadonly()`, clean component APIs, hiding complexity

### The Problem

A dashboard component currently injects four services: `UserService`, `ProductService`, `OrderService`, and `NotificationService`. It orchestrates calls between them directly. It's 200 lines, impossible to test, and every new developer has to understand all four services to touch it.

### Task

Create a `DashboardFacade` service. Move all cross-service orchestration into it. The dashboard component should only inject the facade — one dependency, one API.

The facade exposes:

```ts
readonly dashboardData$: Observable<DashboardData>;
readonly isLoading: Signal<boolean>;   // exposed via asReadonly()
loadDashboard(): void;
```

All internal signals must be declared writable privately and exposed as readonly:

```ts
private readonly _isLoading = signal(false);
readonly isLoading = this._isLoading.asReadonly();
```

### Behavior

- The component has exactly one `inject()` call
- The component template binds only to facade signals/observables
- The four underlying services are hidden — the component doesn't know they exist
- The component cannot call `.set()` or `.update()` on any facade signal — `asReadonly()` enforces this at compile time

### What you'll learn

`asReadonly()` makes the signal's write API disappear for consumers. Without it, a component can bypass the facade's logic by calling `facade.isLoading.set(true)` directly — the encapsulation is broken. This is the signal equivalent of making a class property `private`.

### Hint

The facade is a global singleton — use the v22 `@Service()` decorator instead of `@Injectable({ providedIn: 'root' })`. Think of it as the component's view model extracted into a service.

---

## Challenge 3: The Command Pattern

**Pattern:** Callbacks as data (Command Pattern)
**Concepts:** Typed action objects, generic table components, zero coupling

### The Problem

You have a table component. Different pages need different buttons per row — one page needs "Edit" and "Delete", another needs "Approve" and "Reject". Currently you have `@if` blocks inside the table for each use case.

### Task

Define a `TableAction<T>` type in `shared/models/table-action.model.ts`:

```ts
export type TableAction<T> = {
  label: string;
  icon?: string;
  variant?: 'primary' | 'ghost' | 'danger';
  callback: (row: T) => void;
};
```

Update a shared table component to accept `actions?: TableAction<T>[]` as an optional input. Render an actions column only when actions are provided. Call `action.callback(row)` on click.

Wire it up in two different parent components, each passing a different set of actions.

### Behavior

- The table component has no knowledge of what the actions do
- Adding a new action requires zero changes to the table component
- The actions column is hidden entirely when no actions are passed

### What you'll learn

The table is the *Invoker*. The action object is the *Command*. The parent is the *Client*. This separation means the table component never needs to change when business logic changes.

### Hint

The `variant` field maps directly to a CSS class. The table applies `action.variant` as a class — it doesn't know what "danger" means in business terms.

---

## Challenge 4: Injection Functions

**Pattern:** Injection Functions (Angular 14+)
**Concepts:** Reusable `inject()` logic, composition over inheritance

### The Problem

Three different components all need to do the same thing: subscribe to route params, extract the `id` param, fetch an entity by that id, and handle loading/error state. Currently all three copy-paste the same 20 lines.

### Task

Write an injection function:

```ts
export function injectEntityLoader<T>(
  fetchFn: (id: string) => Observable<T>
): { entity: Signal<T | null>; isLoading: Signal<boolean> } {
  const route = inject(ActivatedRoute);
  const isLoading = signal(false);
  // pipe route.params → fetchFn → toSignal
}
```

Call it at the top of each component's class body. Each component gets `entity` and `isLoading` signals wired up for free.

### Behavior

- The function can only be called in an injection context (field initializer or constructor)
- Each component that calls it gets independent state
- Zero inheritance — pure composition

### Extension (advanced)

Use `inject(TOKEN, { optional: true, self: true })` inside an injection function to create context-aware fallback logic. `self: true` restricts the lookup to the current injector only — no parent traversal. This is the technique library authors use to make functions behave differently depending on where in the tree they are called.

### What you'll learn

Injection functions are Angular's answer to React hooks. They let you package `inject()` calls and reactive logic into reusable units without base classes or mixins. This is the modern replacement for component inheritance.

---

## Challenge 5: Context Provider

**Pattern:** Component-level Providers (DI Scoping)
**Concepts:** `providers: []` in `@Component`, DI hierarchy, feature-scoped services

### The Problem

You have a deep component tree: `FeatureShell` → `FeatureLayout` → `FeatureContent` → `FeatureRow` → `FeatureCell`. The cell needs access to state owned by the shell. You are passing it through inputs at every level (prop drilling).

### Task

Create a `FeatureStateService` and provide it at the `FeatureShell` component level:

```ts
@Component({
  providers: [FeatureStateService]
})
export class FeatureShellComponent { ... }
```

Every child in the tree injects it directly via `inject(FeatureStateService)`. No inputs. No outputs. No event buses.

### Behavior

- `FeatureStateService` is not in the root injector — it doesn't exist globally
- A second instance of `FeatureShell` on the same page gets its own independent service instance
- Destroying `FeatureShell` destroys the service with it — no memory leak
- All intermediate components have zero knowledge of the state

### What you'll learn

Angular's DI is hierarchical. `providedIn: 'root'` is one option — not the only option. Providing at the component level creates a service that lives exactly as long as the component tree it belongs to. This is how you share state across a feature without polluting the global root injector.

### Hint

This is the Angular-native answer to React Context. The component's `providers` array is the context boundary.

---

## Challenge 6: Strategy Pattern via Dependency Injection

**Pattern:** Strategy Pattern with Angular DI (`multi: true`)
**Concepts:** `InjectionToken`, multi-providers, runtime dispatch

### The Problem

You have a notification service that handles three event types: `info`, `warning`, and `error`. Currently it's a `switch` statement. Every time a new event type is added, the service file is modified — a violation of the Open/Closed Principle.

### Task

Define a `NotificationStrategy` interface:

```ts
export interface NotificationStrategy {
  type: string;
  handle(message: string): void;
}
```

Create three separate strategy classes (one per type). Register all three under one `InjectionToken` with `multi: true`. Inject the array into the dispatcher service and build a `Map<string, NotificationStrategy>` from it at construction time.

### Behavior

- The dispatcher never has a `switch` or `if` on event type
- Adding a new event type = creating a new class and registering it, zero other changes
- Each strategy is independently testable

### What you'll learn

`multi: true` turns one token into an array of providers. The dispatcher receives `NotificationStrategy[]` and builds a lookup map. This is the Angular-native way to implement the Strategy pattern — no factory functions, no manual registration, just DI doing the work.

### Hint

Register each strategy in `app.config.ts`:
```ts
{ provide: NOTIFICATION_STRATEGIES, useClass: InfoStrategy, multi: true }
```

---

## Challenge 7: Signal-Driven State Machine

**Pattern:** Finite State Machine (FSM) with computed guards
**Concepts:** Discriminated unions, `signal()`, `computed()`, Signal Forms (v22 stable)

### The Problem

You have a 3-step checkout wizard. The logic for "can the user proceed?" is a mess of nested `if` statements: `isStep1Done && isStep2Valid && !isProcessing`. State bleeds across steps. Illegal combinations are possible at runtime.

### Task

Model the wizard as a discriminated union — make illegal states unrepresentable at the type level:

```ts
type WizardState =
  | { step: 'shipping'; address: string }
  | { step: 'payment'; card: string; shippingAddress: string }
  | { step: 'review'; total: number; card: string; shippingAddress: string };
```

You cannot be in `'payment'` without a `shippingAddress`. You cannot be in `'review'` without both. TypeScript enforces this — not runtime checks.

Drive the UI entirely with `computed()` signals:

```ts
readonly canProceed = computed(() => {
  const s = this.state();
  if (s.step === 'shipping') return s.address.trim().length > 0;
  if (s.step === 'payment') return s.card.length === 16;
  return true;
});
```

Use **Signal Forms** (stable in v22) for each step's form. Bind the form's value signal directly into the state machine transition logic — no manual `valueChanges` subscriptions.

```ts
readonly shippingModel = signal({ address: '' });
readonly shippingForm = form(this.shippingModel, schema => {
  required(schema.address, { message: 'Address is required' });
});
```

```html
<input [formField]="shippingForm.address" />
@if (shippingForm.address().invalid() && shippingForm.address().touched()) {
  <p class="error">{{ shippingForm.address().errors()[0].message }}</p>
}
<button [disabled]="shippingForm().invalid()">Next</button>
```

The form's validity feeds the FSM — when the user advances, read `shippingForm.address().value()` and call `this.state.set({ step: 'payment', shippingAddress: ... })`.

### Behavior

- Transitioning backward clears forward state
- `canProceed` is derived, never manually set
- The template has zero business logic — it reads signals and calls methods
- Form validation is driven by Signal Forms, not `FormGroup.valid`

### What you'll learn

`computed()` signals turn state transition guards into declarative, lazily-evaluated expressions. Signal Forms eliminate the `valueChanges` subscription layer. The union type eliminates the "impossible state" class of bugs entirely. This is the 2026 standard: the UI is passive, the data is active.

### Hint

Each step transition is a method on the component that calls `this.state.set({ step: 'payment', ... })`. The type system forces you to provide all required fields for the new step.

---

## Challenge 8: TypeScript Type Patterns

**Pattern:** `as const`, `satisfies`, `readonly`, Discriminated Unions, exhaustive checking
**Concepts:** Compile-time safety, type narrowing, literal types

### Part A — `as const` + `satisfies`

Define a route config object. Use `as const` to prevent widening and `satisfies` to enforce the type shape without losing literal inference:

```ts
const ROUTES = {
  home: '/home',
  products: '/products',
  admin: '/admin',
} as const satisfies Record<string, string>;
```

`ROUTES.home` is typed as `'/home'`, not `string`. Autocomplete works. Typos are caught at compile time.

### Part B — Discriminated Unions + `assertNever`

Define:
```ts
type ApiResult<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
```

Write an `assertNever` helper:

```ts
function assertNever(x: never): never {
  throw new Error('Unhandled case: ' + JSON.stringify(x));
}
```

Use it as the default branch in every `switch` on `status`. Now add a fourth `status: 'empty'` to the union — the code will fail to compile until you handle it. TypeScript forces exhaustiveness.

v22 ships the same guarantee for templates. Use `@default never` in `@switch` blocks:

```html
@switch (result.status) {
  @case ('loading') { <app-spinner /> }
  @case ('success') { <app-data [data]="result.data" /> }
  @case ('error')   { <p>{{ result.message }}</p> }
  @default never;
}
```

The compiler errors if any union member is unhandled — no `assertNever` helper needed in the template. Use both: `assertNever` in TypeScript logic, `@default never` in templates.

### Part C — `ReadonlyArray` + `Readonly<T>`

Take a service that exposes a mutable array. Make it impossible for consumers to mutate it by returning `ReadonlyArray<T>`. TypeScript blocks `.push()`, `.sort()`, and `.splice()` at compile time — not at runtime.

### What you'll learn

`as const` = narrowest possible type, frozen at compile time.
`satisfies` = validates shape without widening.
`assertNever` = exhaustive union handling in TypeScript logic, enforced by the compiler.
`@default never` = same guarantee in templates — compiler errors on unhandled union members.
`ReadonlyArray` = mutation is a compile error, not a runtime surprise.

---

---

## Challenge 9: Undo Stack via Command Pattern

**Pattern:** Command Pattern with history
**Concepts:** Reversible commands, `signal<Command[]>` history, undo/redo

### The Problem

A user edits a list of items — renaming, reordering, deleting. There is no undo. One wrong click and the change is permanent.

### Task

Extend the `TableAction<T>` type with an optional `undo` callback:

```ts
export type TableAction<T> = {
  label: string;
  icon?: string;
  variant?: 'primary' | 'ghost' | 'danger';
  callback: (row: T) => void;
  undo?: (row: T) => void;
};
```

Maintain a `signal<ExecutedAction<T>[]>` history in a service. When an action with `undo` is executed, push it to the history stack. Expose an `undoLast()` method that pops the stack and calls `undo(row)` on the last entry.

### Behavior

- Actions without `undo` execute normally, nothing pushed to history
- Actions with `undo` push to history on execution
- `undoLast()` reverses the most recent undoable action and removes it from history
- An "Undo" button is disabled when history is empty
- History is scoped to the component tree (provided at component level, not root)

### What you'll learn

The Command Pattern's real power is reversibility — separating "what to do" from "how to undo it" into the same object. The history stack is just a `signal<Command[]>` — `computed(() => history().length > 0)` drives the undo button state. No external state manager needed.

---

## Acceptance Criteria

- [ ] Challenge 1: Dumb component has zero `inject()` calls; at least one input uses `transform`
- [ ] Challenge 2: All facade signals exposed via `asReadonly()`; component cannot call `.set()` on them
- [ ] Challenge 3: Table component unchanged when a new action is added to a parent
- [ ] Challenge 4: Injection function works in at least two different components; zero shared state between them
- [ ] Challenge 5: Feature service not in root injector; two shell instances have independent state
- [ ] Challenge 6: New event type added without touching the dispatcher service
- [ ] Challenge 7: Illegal state transitions are impossible at the type level; no boolean flags; Signal Forms used for step inputs
- [ ] Challenge 8: No `any`, no `as` type assertions; `assertNever` used in every discriminated union switch
- [ ] Challenge 9: Undo reverses the last action; history is empty after full undo sequence; undo button disabled when nothing to undo

---

## Pattern Quick Reference

| Pattern | When to use |
|---|---|
| Smart / Dumb Split | Component mixes data fetching with rendering |
| Facade + `asReadonly()` | Component injects 3+ services and orchestrates between them |
| Command Pattern | Multiple parents need different row actions on the same table |
| Undo Stack | Actions need to be reversible; history tracked as `signal<Command[]>` |
| Injection Function | Same `inject()` + reactive logic copy-pasted across components |
| Context Provider | Deep tree needs shared state without prop drilling or global scope |
| Strategy via DI | `switch` on type that grows over time |
| Signal FSM | Multi-step flow with illegal states and derived transition guards |
| `as const satisfies` | Config/lookup objects where literal types matter |
| `assertNever` | Exhaustive union handling in TypeScript logic |
| `@default never` | Same exhaustiveness guarantee in templates (v22) |
| `ReadonlyArray` | Service exposes a collection that consumers must never mutate |

---

## Resources

- [Smart vs Dumb Components — modernangular.com](https://modernangular.com/articles/refactoring-into-smart-and-dumb-components)
- [Angular Facade Pattern — angular.love](https://angular.love/angular-facade-pattern)
- [Strategy Pattern the Angular Way — angularspace.com](https://www.angularspace.com/strategy-pattern-the-angular-way-di-and-runtime-flexibility/)
- [Angular Inject & Injection Functions — marmicode.io](https://marmicode.io/blog/angular-inject-and-injection-functions)
- [Complete guide to const assertions — logrocket.com](https://blog.logrocket.com/complete-guide-const-assertions-typescript/)
- [satisfies vs as — dev.to](https://dev.to/benarambide/understanding-typescripts-satisfies-vs-as-3d6)
- [readonly in TypeScript — betterstack.com](https://betterstack.com/community/guides/scaling-nodejs/ts-readonly/)
- [Design Patterns in Angular — dev.to](https://dev.to/armandotrue/design-patterns-in-angular-part-i-3ld7)
