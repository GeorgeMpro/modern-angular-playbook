# ng-template Challenge #3: Dynamic Data Table with Context

**Difficulty:** Medium
**Angular Version:** 22+
**Focus:** `ngTemplateOutletContext`, `$implicit`, typed generics, `let-` syntax

---

## The Problem

A generic table component that only accepts `any[]` is useless — you lose all type safety in the row template. A reusable table needs to know the shape of its data so the row template gets proper type inference. `ngTemplateOutletContext` is the mechanism for passing per-row data from the table component into a template defined by the parent.

---

## Task

Build a generic `DataTableComponent<T>` that knows how to iterate rows but has no opinion on what a row looks like.

### DataTableComponent

- Generic over `T` — the component itself has a type parameter
- Accepts `data` (the array) and `rowTemplate` (how to render each row) as required inputs
- The `rowTemplate` input type should reflect the generic — no `any`
- Iterates the data and renders each row using `ngTemplateOutlet`, passing the current item as context

### Parent — two usages

**Usage 1: User table** — render id, name, role, and status for a list of users

**Usage 2: Product table** — use a completely different data shape with the same `DataTableComponent`

This proves the component is truly generic and reusable.

### `$implicit` — what it means

`ngTemplateOutletContext` is a plain object. Any key on it becomes accessible in the template via `let-keyName`. The special key `$implicit` maps to the bare `let-variable` syntax — no key name needed.

To pass multiple values, add named keys alongside `$implicit`. Each named key requires an explicit `let-varName="keyName"` binding in the template.

### Type Safety: `ngTemplateContextGuard`

Even with a typed `TemplateRef<{ $implicit: T }>`, the Angular template compiler cannot propagate `T` into the `let-` variable when the template is defined in a parent and passed as an input — you get `any` instead of the real type.

The fix is **not** a guard on the component. Angular only calls `ngTemplateContextGuard` when the directive/component is applied directly to the `<ng-template>` — not when a `TemplateRef` is passed as an input.

The correct pattern: create a lightweight `TypedRow<T>` directive whose selector is `ng-template[typedRow]`. Apply it to the `ng-template` in the parent with `[typedRow]="data"`. The directive has no runtime effect — it exists purely so the template type checker knows where to find the guard. The guard narrows the context to `{ $implicit: T; index: number }`, making `let-item` typed as `T`.

The method body always returns `true` — it is a compile-time hint only.

---

## Behavior

- The row variable in the template has full type inference — IDE shows properties, TypeScript catches wrong property access
- `DataTableComponent` does not import or reference any specific row type
- The same component renders both tables with completely different layouts
- At least one named context variable (e.g. `index`) is passed and used alongside `$implicit`

---

## Acceptance Criteria

- [ ] `DataTableComponent` is generic — `DataTableComponent<T>`
- [ ] No `any` in the component or its inputs
- [ ] `let-user` in the row template has full type inference (IDE shows properties)
- [ ] Two different data shapes use the same `DataTableComponent`
- [ ] `$implicit` is used for the row data; at least one named context variable (`index` or similar) is also passed and used
- [ ] A `TypedRow<T>` directive with `ngTemplateContextGuard` is applied to the `ng-template` in the parent — TypeScript catches wrong property access on `let-item` at build time
