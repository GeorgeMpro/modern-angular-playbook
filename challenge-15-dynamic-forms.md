# Challenge #15: Dynamic Forms — Reactive Forms vs Signal Forms

**Difficulty:** Medium-Hard
**Angular Version:** 22+
**Focus:** Dynamic field generation, `FormArray`/`FormRecord` vs Signal Forms `applyEach`, same scenario built twice for a direct, apples-to-apples comparison

---

## Context

`challenge-10-advanced-forms.md` covered dynamic Reactive Forms (`FormArray` for repeating groups).
It predates Signal Forms entirely. This challenge asks the same category of question — "how do you
build a form whose fields aren't known until runtime?" — but answers it twice: once with classic
Reactive Forms, once with Signal Forms (stable since v22). Same scenario, same behavior, two
implementations, so the difference is something you feel in the code, not something you read about.

There are two distinct flavors of "dynamic," and the scenario below deliberately needs both:

1. **Known shape, variable length** — a list of attendees. You don't know how *many* there'll be,
   but you know each one is `{ name, email }`. This is `FormArray` territory.
2. **Unknown shape, driven by runtime config** — custom questions an event organizer defines on the
   fly (`{ id, label, type, required }`). You don't know the *field names* until the config loads.
   This is `FormRecord` territory in Reactive Forms — and, as you'll find in Part B, Signal Forms
   doesn't have a direct equivalent for this case. That gap is the real payoff of doing both.

---

## Scenario: Event Registration Form Builder

- **Attendees** — repeating group. Each attendee: `name`, `email`. Add/remove freely, minimum 1.
- **Custom Questions** — the organizer supplies a config array at runtime:
  ```ts
  type QuestionConfig = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox';
    required: boolean;
    options?: string[]; // only for 'select'
  };
  ```
  The form must render one field per entry in this array — nothing hardcoded in the template — and
  apply `required` validation per-question, driven by the config, not by a fixed set of validators.

Build this scenario twice: **Part A** with Reactive Forms, **Part B** with Signal Forms.

---

## Part A: Reactive Forms

### A1: Attendees (`FormArray`)

**Concept:** `FormArray` of `FormGroup` — known shape, variable length

#### Task

```ts
attendees = this.fb.array([this.createAttendeeGroup()]);

private createAttendeeGroup(): FormGroup {
  return this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
}

addAttendee(): void { this.attendees.push(this.createAttendeeGroup()); }
removeAttendee(i: number): void { this.attendees.removeAt(i); }
```

#### Behavior

- At least one attendee row exists at all times — removing the last one is a no-op
- Adding a row appends an empty, untouched, invalid `FormGroup`
- Each row validates independently — one invalid attendee doesn't block another's validity

#### What you'll learn

`FormArray` tracks a *list* of controls with the same shape. `push`/`removeAt` mutate the array
in place — this is imperative, not declarative, and it's the API you already used in `challenge-10`.

---

### A2: Custom Questions (`FormRecord`)

**Concept:** `FormRecord` — unknown keys, built from runtime config

#### The Problem

`FormGroup` assumes you know the control names when you write the code. Here you don't — the
question `id`s come from a config array loaded at runtime. `FormArray` doesn't fit either: you need
to look controls up *by key* (`question.id`), not by index.

#### Task

```ts
customAnswers = this.fb.record<FormControl>({});

buildFromConfig(questions: QuestionConfig[]): void {
  for (const q of questions) {
    const validators = q.required ? [Validators.required] : [];
    this.customAnswers.addControl(q.id, this.fb.control('', validators));
  }
}
```

```html
@for (q of questions; track q.id) {
  <label>{{ q.label }}</label>
  @switch (q.type) {
    @case ('text') { <input [formControl]="getControl(q.id)" type="text" /> }
    @case ('number') { <input [formControl]="getControl(q.id)" type="number" /> }
    @case ('select') { <select [formControl]="getControl(q.id)">
      @for (opt of q.options; track opt) { <option [value]="opt">{{ opt }}</option> }
    </select> }
    @case ('checkbox') { <input [formControl]="getControl(q.id)" type="checkbox" /> }
  }
}
```

#### Behavior

- A question with `required: true` and no answer makes `customAnswers` invalid
- A question with `required: false` never blocks form validity, regardless of value
- Loading a new config array rebuilds the record — stale controls from the old config are removed
- The `@switch` on `type` renders the correct input for each question, driven only by config

#### What you'll learn

`FormRecord<T>` is Reactive Forms' answer to "a group of controls, all the same value type, keyed
by a name you don't know ahead of time" — distinct from both `FormGroup` (fixed known keys) and
`FormArray` (fixed known shape, ordered list). It's the least-known of the three and the correct
tool the moment "which controls exist" becomes a runtime question.

#### Hint

`FormRecord` methods (`addControl`, `removeControl`, `contains`) are the same API surface as
`FormGroup` — the difference is purely semantic (arbitrary/dynamic keys vs a fixed known shape).

---

## Part B: Signal Forms

### B1: Attendees

**Concept:** `form()` + `applyEach()` over a plain array signal — no separate array API to learn

#### Task

```ts
attendeesModel = signal([{ name: '', email: '' }]);

registrationForm = form(this.attendeesModel, (schemaPath) => {
  applyEach(schemaPath, (item) => {
    required(item.name, { message: 'Name is required' });
    required(item.email, { message: 'Email is required' });
    email(item.email, { message: 'Enter a valid email address' });
  });
});

addAttendee(): void {
  this.attendeesModel.update(list => [...list, { name: '', email: '' }]);
}
removeAttendee(i: number): void {
  this.attendeesModel.update(list => list.filter((_, idx) => idx !== i));
}
```

```html
@for (attendee of registrationForm; track $index) {
  <input [formField]="attendee.name" />
  @if (attendee.name().touched() && attendee.name().invalid()) {
    @for (err of attendee.name().errors(); track err) { <li>{{ err.message }}</li> }
  }
}
```

#### Behavior

- Identical observable behavior to A1: at least one row always present, independent per-row validity
- Adding/removing a row is a plain array mutation on `attendeesModel` — no `new FormGroup()`, no
  `.push()` on a forms API, no manual array-index bookkeeping in a separate structure

#### What you'll learn

There's no `FormArray` class in Signal Forms because there doesn't need to be — `form()` mirrors
whatever shape your data signal has, arrays included. `applyEach()` is what supplies validation
across every current item, and it re-runs automatically as the array's length changes. Compare the
line count against A1 directly — this is the concrete version of "less boilerplate," not a slogan.

---

### B2: Custom Questions — the open problem

**Concept:** where the 1:1 translation from Reactive Forms breaks down

#### The Problem

Signal Forms' `schema` function is written against a *known* model shape at compile time — that's
how `schemaPath.name` gets type-checked. `FormRecord` exists precisely because Reactive Forms has no
such requirement. There is no documented `FormRecord`-equivalent for Signal Forms as of v22.

#### Task

This is intentionally open — there isn't a single documented right answer, and finding that out is
the point. Explore at least one working approach, for example:

- Model custom answers as an **array** instead of a keyed record — `{ questionId: string; value:
  unknown }[]` — since arrays *are* natively dynamic in Signal Forms via `applyEach()`. Validation
  becomes conditional inside the `applyEach` callback, driven by looking up each item's config by
  `questionId` rather than by a schema path per field.
- Or: build the model signal's shape dynamically before calling `form()` (construct the initial
  object with all question `id`s as keys once the config loads), accepting that `form()` must be
  re-created if the config changes after the fact.

Implement one approach. Write up **in the challenge file itself** (a short "Findings" section you
add) which one you chose, what broke or felt awkward, and why the direct `FormRecord` translation
doesn't exist.

#### Behavior

- Same validation behavior as A2 (per-question `required`, driven by config)
- Same rendering behavior as A2 (`@switch` on `type`, driven by config)
- A written note explaining the chosen workaround and its tradeoff vs `FormRecord`

#### What you'll learn

Not every Reactive Forms primitive has a Signal Forms equivalent yet — knowing that gap exists (and
being able to explain it) is more valuable than pretending it doesn't. This is also a realistic
preview of the kind of judgment call actual migration work requires.

---

## Acceptance Criteria

- [ ] A1: `FormArray` of attendees — add/remove works, minimum 1 enforced, independent row validity
- [ ] A2: `FormRecord` built from runtime config — per-question `required` validation, correct input
      type rendered per `@switch`, stale controls removed on config reload
- [ ] B1: Same attendee behavior as A1, implemented via `form()` + `applyEach()` over a plain array
      signal, add/remove as direct model mutation
- [ ] B2: A working (not necessarily elegant) solution for dynamic per-question validation without
      `FormRecord`, plus a written explanation of the approach and its tradeoffs
- [ ] Comparison table completed (see below) — required, not optional

---

## Required Deliverable: Comparison Table

Fill in from your own implementation, not from documentation claims:

| Dimension | Reactive Forms | Signal Forms |
|---|---|---|
| Lines of code (attendees) | | |
| Lines of code (custom questions) | | |
| How "unknown keys" is handled | `FormRecord` | (your chosen workaround) |
| Type safety | | |
| Testability | | |
| Boilerplate for add/remove | | |

---

## Pattern Quick Reference

| Pattern | When to use |
|---|---|
| `FormArray` | Known shape, variable-length list (Reactive Forms) |
| `FormRecord` | Unknown/dynamic keys, same value type per key (Reactive Forms) |
| `form()` + `applyEach()` | Array-shaped data in Signal Forms — no separate array API needed |
| `[formField]` | Signal Forms' binding directive — two-way sync between model, field state, and UI |
| `.touched()` / `.invalid()` / `.errors()` | Signal Forms field state, read as signals |

---

## Resources

- [Angular Forms — Signal Forms: Models](https://angular.dev/guide/forms/signals/models)
- [Angular Forms — Signal Forms: Validation](https://angular.dev/guide/forms/signals/validation)
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [FormArray — Angular API](https://angular.dev/api/forms/FormArray)
- [FormRecord — Angular API](https://angular.dev/api/forms/FormRecord)
- [Announcing Angular v22 — Angular Blog](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664)
