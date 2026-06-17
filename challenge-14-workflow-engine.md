# Challenge #14: The Workflow Engine

**Difficulty:** Hard
**Angular Version:** 22+
**Focus:** Finite State Machine, Repository Pattern, Facade Pattern, Dispatch Table

---

## Context

Challenge 12 was about RxJS operators. Challenge 13 was about isolated pattern exercises.
Challenge 14 combines three senior-level patterns into one cohesive real-world scenario — the kind of system you will build and be asked about in interviews at companies running complex approval workflows.

**Scenario:** A permit application system. Citizens submit applications (building, event, noise permits). A reviewer can approve, reject, or request revisions. Revision sends the application back to a submittable state — the workflow is not linear.

---

## Why This Matters in Interviews

| Pattern | Interview signal |
|---|---|
| Finite State Machine | "Making illegal states unrepresentable" — the highest form of defensive coding |
| Repository | "Components never touch the data layer" — separation of concerns |
| Facade | "Framework churn protection" — swap NgRx for signals without touching the UI |
| Dispatch Table | "Open/Closed Principle" — add an action without modifying the component |

---

## Project Structure

```
src/app/
├── mock/
│   └── workflow-mock.service.ts     ← provided scaffolding, do not modify
├── shared/
│   └── models/
│       └── application.model.ts     ← models + state union type
├── repository/
│   ├── application.repository.ts    ← IApplicationRepository interface + token
│   └── mock-application.repository.ts ← wraps WorkflowMockService
└── workflow/
    ├── application.facade.ts        ← owns FSM + calls repository
    ├── workflow-shell/
    │   ├── workflow-shell.ts        ← smart, injects only ApplicationFacade
    │   ├── workflow-shell.html
    │   └── workflow-shell.scss
    ├── workflow-status/
    │   ├── workflow-status.ts       ← dumb, receives WorkflowState as input
    │   └── workflow-status.html
    ├── workflow-actions/
    │   ├── workflow-actions.ts      ← dumb, receives ApplicationAction[] as input
    │   └── workflow-actions.html
    └── workflow-timeline/
        ├── workflow-timeline.ts     ← dumb, receives history array as input
        └── workflow-timeline.html
```

---

## Mock Service Scaffolding

**File:** `src/app/mock/workflow-mock.service.ts`

This file is provided for you — do not modify it. It is the backend contract.

```ts
@Service()
export class WorkflowMockService {
  // 200ms delay, no failure
  getApplication(id: number): Observable<PermitApplication>

  // 300ms delay, ~10% failure rate (simulates network issues)
  submitApplication(id: number): Observable<PermitApplication>

  // 200ms delay, no failure
  startReview(id: number): Observable<PermitApplication>

  // 300ms delay, no failure
  approveApplication(id: number): Observable<PermitApplication>

  // 300ms delay, no failure
  rejectApplication(id: number, reason: string): Observable<PermitApplication>

  // 300ms delay, no failure — returns application with status 'submitted'
  requestRevision(id: number, notes: string): Observable<PermitApplication>
}
```

Seed data — 3 applications to work with:
```ts
[
  { id: 1, type: 'building', title: 'Roof Extension — 14 Rothschild', status: 'draft' },
  { id: 2, type: 'event',    title: 'Street Market — Dizengoff Square', status: 'in_review' },
  { id: 3, type: 'noise',    title: 'Construction Work — Ben Gurion 7', status: 'rejected' },
]
```

**You must implement this service** in full before starting the patterns. The signature above is the contract — methods, delay, and failure rate are fixed.

---

## Models

**File:** `src/app/shared/models/application.model.ts`

```ts
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'revision_required';

export interface PermitApplication {
  id: number;
  type: 'building' | 'event' | 'noise';
  title: string;
  status: ApplicationStatus;
  submittedAt?: Date;
  reviewNotes?: string;
}

export interface ApplicationAction {
  label: string;
  style: 'primary' | 'danger' | 'warning';
  callback: () => void;
}
```

---

## Challenge 1: The Finite State Machine

**Pattern:** FSM with discriminated unions
**Key concept:** Illegal states are unrepresentable at the type level

### The Problem

The application has 6 statuses. In a naive implementation, you have a `status: ApplicationStatus` field and scattered `if (status === 'in_review')` checks everywhere. Nothing stops you from constructing an `approved` application without a timestamp, or a `rejected` one without a reason. The compiler doesn't help you.

### Task

Model the application state as a **discriminated union** where each status carries exactly the data it requires — no more, no less:

```ts
export type WorkflowState =
  | { status: 'draft';              application: PermitApplication }
  | { status: 'submitted';          application: PermitApplication; submittedAt: Date }
  | { status: 'in_review';          application: PermitApplication }
  | { status: 'approved';           application: PermitApplication; approvedAt: Date }
  | { status: 'rejected';           application: PermitApplication; reason: string }
  | { status: 'revision_required';  application: PermitApplication; notes: string };
```

### Valid Transitions

```
draft             → submitted        (via submit())
submitted         → in_review        (via startReview())
in_review         → approved         (via approve())
in_review         → rejected         (via reject(reason))
in_review         → revision_required (via requestRevision(notes))
revision_required → submitted        (via submit())
```

Everything else is illegal. A `draft` cannot be approved. A `submitted` cannot be rejected. TypeScript enforces this — not runtime checks, not guards, the type system itself.

### Verification

Try to write this in TypeScript — it must not compile:
```ts
// This should be a type error:
const state: WorkflowState = { status: 'rejected', application: app };
// Missing required field 'reason' — compiler catches it.
```

---

## Challenge 2: The Repository Pattern

**Pattern:** Repository — data access behind an interface
**Key concept:** Components and the facade never import `HttpClient` or `WorkflowMockService` directly

### The Problem

If your facade calls `WorkflowMockService` directly, swapping for real HTTP means changing the facade. The facade shouldn't know or care where data comes from.

### Task

Define an interface and an injection token:

```ts
// src/app/repository/application.repository.ts

export const APPLICATION_REPOSITORY = new InjectionToken<IApplicationRepository>(
  'APPLICATION_REPOSITORY'
);

export interface IApplicationRepository {
  getApplication(id: number): Observable<PermitApplication>;
  submit(id: number): Observable<PermitApplication>;
  startReview(id: number): Observable<PermitApplication>;
  approve(id: number): Observable<PermitApplication>;
  reject(id: number, reason: string): Observable<PermitApplication>;
  requestRevision(id: number, notes: string): Observable<PermitApplication>;
}
```

Implement it:

```ts
// src/app/repository/mock-application.repository.ts
@Service()
export class MockApplicationRepository implements IApplicationRepository {
  private readonly mock = inject(WorkflowMockService);
  // delegate every method to the mock service
}
```

Register in `app.config.ts`:
```ts
{ provide: APPLICATION_REPOSITORY, useExisting: MockApplicationRepository }
```

### Verification

Swap the registration to a `RealApplicationRepository` (stub returning `of(...)`) — zero changes in the facade or components.

---

## Challenge 3: The Facade

**Pattern:** Facade + `asReadonly()`
**Key concept:** The component has exactly one `inject()` call

### The Problem

`WorkflowShell` would otherwise need to inject the repository, manage the state signal, handle errors, track loading, and compute derived values. That's four responsibilities in one component.

### Task

Build `ApplicationFacade` — it owns the FSM signal and all transitions:

```ts
@Service()
export class ApplicationFacade {
  private readonly repo = inject(APPLICATION_REPOSITORY);

  private readonly _state = signal<WorkflowState | null>(null);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _history = signal<WorkflowState[]>([]);

  // Exposed as readonly — component cannot call .set()
  readonly state = this._state.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly history = this._history.asReadonly();

  // Derived — never manually set
  readonly canSubmit = computed(() => {
    const s = this._state();
    return s?.status === 'draft' || s?.status === 'revision_required';
  });
  readonly availableActions = computed<ApplicationAction[]>(() => ACTION_MAP[this._state()?.status ?? 'draft']);

  load(id: number): void { ... }
  submit(): void { ... }
  startReview(): void { ... }
  approve(): void { ... }
  reject(reason: string): void { ... }
  requestRevision(notes: string): void { ... }
}
```

Each action method:
1. Sets `_isProcessing` to `true`
2. Calls the repository
3. Uses `tap` to update `_state` and push to `_history` (ch10 pattern)
4. Uses `catchError` to set `_error` and revert state
5. Uses `finalize` to set `_isProcessing` back to `false`

### Verification

Open `WorkflowShell` — it has exactly one `inject()` call. The template binds only to facade signals. It cannot call `facade._state.set(...)` — `asReadonly()` blocks it at compile time.

---

## Challenge 4: Dispatch Table

**Pattern:** Dispatch Table (Action Map)
**Key concept:** `ACTION_MAP` is the only place that changes when actions change — not the component

### Task

Define the action map in `application.facade.ts` or `application.model.ts`:

```ts
const ACTION_MAP: Record<ApplicationStatus, ApplicationAction[]> = {
  draft:             [{ label: 'Submit',           style: 'primary',  callback: () => facade.submit() }],
  submitted:         [{ label: 'Start Review',      style: 'primary',  callback: () => facade.startReview() }],
  in_review:         [
    { label: 'Approve',           style: 'primary',  callback: () => facade.approve() },
    { label: 'Reject',            style: 'danger',   callback: () => facade.reject(prompt('Reason') ?? '') },
    { label: 'Request Revision',  style: 'warning',  callback: () => facade.requestRevision(prompt('Notes') ?? '') },
  ],
  revision_required: [{ label: 'Resubmit',          style: 'primary',  callback: () => facade.submit() }],
  approved:          [],
  rejected:          [],
};
```

Pass `facade.availableActions()` as input to `WorkflowActionsComponent`. It renders a button per action, applies `action.style` as a CSS class, calls `action.callback()` on click. The component has no switch statement.

---

## Component Responsibilities

### `WorkflowShell` (smart)
- Injects `ApplicationFacade` only
- Calls `facade.load(1)` on init (or allows ID selection)
- Passes signals down to dumb children as inputs

### `WorkflowStatus` (dumb)
- Input: `state: WorkflowState | null`
- Displays current status with a color indicator (use `COLOR_MAP: Record<ApplicationStatus, string>`)
- Displays application title and type
- Zero `inject()` calls

### `WorkflowActions` (dumb)
- Input: `actions: ApplicationAction[]`
- Input: `isProcessing: boolean`
- Renders one button per action, disabled when `isProcessing`
- Zero knowledge of what the actions do

### `WorkflowTimeline` (dumb)
- Input: `history: WorkflowState[]`
- Displays the sequence of states the application passed through
- Shows timestamp if available on the state
- Zero `inject()` calls

---

## Behavior

- Loading the application sets state to `draft` | `in_review` | etc. based on mock data
- Each transition is async — `isProcessing` is true during the call
- A failed `submit()` reverts state to `draft` and sets `error`
- The timeline grows with each successful transition
- Illegal transitions are not possible — the action map only exposes valid actions for the current state

---

## What you'll learn

**FSM:** The union type makes illegal states impossible before you write a single guard. TypeScript is your runtime — `rejected` without a `reason` is a compile error.

**Repository:** The facade injects `IApplicationRepository` via token. It has no idea whether the data is mock, HTTP, or cache. Swapping implementations is one line in `app.config.ts`.

**Facade:** The component is passive. It reads signals and calls methods. It cannot break the FSM — `asReadonly()` on every signal, no direct access to the repository.

**Dispatch Table:** Adding a new action (`'withdraw'` for submitted state) is one entry in `ACTION_MAP`. The component doesn't change.

---

## Acceptance Criteria

- [ ] `WorkflowShell` has exactly one `inject()` call
- [ ] Constructing `{ status: 'rejected', application }` (missing `reason`) is a TypeScript error
- [ ] Constructing `{ status: 'approved', application }` (missing `approvedAt`) is a TypeScript error
- [ ] Swapping `MockApplicationRepository` for a stub requires zero changes outside `app.config.ts`
- [ ] No component template contains business logic — only signal reads and method calls
- [ ] `ACTION_MAP` covers all 6 statuses — no unhandled cases (use `assertNever` or `satisfies Record<ApplicationStatus, ...>`)
- [ ] `isProcessing` is `true` while any repository call is in flight
- [ ] Failed `submit()` is handled — state reverts, error is shown, `isProcessing` returns to `false`
- [ ] `WorkflowTimeline` shows the full transition history since load

---

## Scaffolding Checklist

Before implementing the patterns, write these first:

1. `application.model.ts` — `ApplicationStatus`, `PermitApplication`, `WorkflowState` union, `ApplicationAction`
2. `workflow-mock.service.ts` — `WorkflowMockService` with the 6 methods above (seed data included)
3. `application.repository.ts` — `IApplicationRepository` interface + `APPLICATION_REPOSITORY` token
4. `mock-application.repository.ts` — `MockApplicationRepository` implementing the interface

Then implement:
5. `application.facade.ts` — FSM signal + dispatch table + all transition methods
6. Components — shell first, then dumb children

---

## Resources

- [Discriminated Unions — TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Facade Pattern in Angular — angular.love](https://angular.love/angular-facade-pattern)
- [Strategy Pattern the Angular Way — angularspace.com](https://www.angularspace.com/strategy-pattern-the-angular-way-di-and-runtime-flexibility/)
- [InjectionToken — Angular Docs](https://angular.dev/api/core/InjectionToken)
- [asReadonly — Angular Signals](https://angular.dev/guide/signals#signal-readonly)
- [assertNever — TypeScript pattern](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
