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

```ts
@Component({ selector: 'app-data-table', ... })
export class DataTableComponent<T> {
  readonly data        = input.required<T[]>();
  readonly rowTemplate = input.required<TemplateRef<{ $implicit: T }>>();
}
```

```html
<table>
  <tbody>
    @for (item of data(); track $index) {
      <ng-container
        [ngTemplateOutlet]="rowTemplate()"
        [ngTemplateOutletContext]="{ $implicit: item }" />
    }
  </tbody>
</table>
```

### Parent — two usages

**Usage 1: User table**

```ts
readonly users = signal([
  { id: 1, name: 'George', role: 'Admin',  status: 'active'   },
  { id: 2, name: 'Alice',  role: 'Editor', status: 'inactive' },
  { id: 3, name: 'Bob',    role: 'Viewer', status: 'active'   },
]);
```

```html
<ng-template #userRow let-user>
  <tr>
    <td>{{ user.name }}</td>
    <td>{{ user.role }}</td>
    <td [class]="user.status">{{ user.status }}</td>
  </tr>
</ng-template>

<app-data-table [data]="users()" [rowTemplate]="userRow" />
```

**Usage 2: Product table** — use a different data shape with the same `DataTableComponent`. This proves the component is truly generic and reusable.

### `$implicit` — what it means

`ngTemplateOutletContext` is a plain object. Any key you put on it becomes accessible in the template via `let-keyName`. The special key `$implicit` maps to the bare `let-variable` syntax — no key name needed:

```html
<!-- $implicit maps to the bare let- variable -->
<ng-template let-user>         <!-- reads $implicit -->
<ng-template let-user="user">  <!-- reads the 'user' key explicitly -->
```

To pass multiple values:
```ts
[ngTemplateOutletContext]="{ $implicit: item, index: i, total: data().length }"
```
```html
<ng-template let-item let-i="index" let-total="total">
```

### Behavior

- `user.name`, `user.role`, `user.status` are fully typed inside the row template — no `any`, no casting
- The `DataTableComponent` does not import or reference the `User` type
- The same component renders the product table with a completely different row layout
- TypeScript catches if you access a property that doesn't exist on the row type

### What you'll learn

`ngTemplateOutletContext` is the bridge between the table's loop and the parent's template. The table knows the data — the parent knows the layout. Context is how the table passes each row to the parent's template at render time.

The generic `T` type parameter on the component propagates into the `TemplateRef<{ $implicit: T }>` input, which gives the `let-user` variable its type in the parent template. Without the generic, the row template's variable is `any` and you lose all IDE assistance.

### Type Safety: `ngTemplateContextGuard`

Even with `TemplateRef<{ $implicit: T }>`, the Angular template compiler sometimes can't propagate `T` into the `let-` variable — you get `any` in the IDE instead of the real type. The fix is a static type guard on the component:

```ts
export class DataTableComponent<T> {
  readonly data        = input.required<T[]>();
  readonly rowTemplate = input.required<TemplateRef<{ $implicit: T }>>();

  static ngTemplateContextGuard<T>(
    dir: DataTableComponent<T>,
    ctx: unknown
  ): ctx is { $implicit: T } {
    return true;
  }
}
```

Angular's template compiler calls this guard when it type-checks the template. The return type `ctx is { $implicit: T }` narrows the context object so `let-user` becomes `T` — not `any`. The method body always returns `true`; it exists purely for the type system.

### Hint

TypeScript generic components work the same way as generic functions. When you pass `[data]="users()"` where `users` is `signal<User[]>`, Angular infers `T = User` for that instance — including the `rowTemplate` input type.

---

## Acceptance Criteria

- [ ] `DataTableComponent` is generic — `DataTableComponent<T>`
- [ ] No `any` in the component or its inputs
- [ ] `let-user` in the row template has full type inference (IDE shows properties)
- [ ] Two different data shapes use the same `DataTableComponent`
- [ ] `$implicit` is used for the row data; at least one named context variable (`index` or similar) is also passed and used
- [ ] `static ngTemplateContextGuard` implemented — hovering `let-user` in the IDE shows the concrete type, not `any`
