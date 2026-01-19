# NG-TEMPLATE CHALLENGE #3: Dynamic Data Table with Context

### Your Persona
You are comfortable with `ngTemplateOutlet`. Now you need to learn how to make your templated components truly dynamic by passing data from the component *down* into the template being rendered.

### The Learning Goal
Master passing contextual data from a component into a template provided by a parent. This is the key to creating reusable components that render lists of complex, custom-structured data (e.g., tables, feeds, card lists).

### The Scenario
You will build a generic, reusable `data-table` component. The component will know how to render a list of items, but it will have **no idea** what each row should look like. The parent component will provide the data *and* the template for rendering a single row, giving the parent full control over the look and feel.

### The Requirements
1.  All components **must** be `standalone: true` and use modern `@for` syntax.
2.  Create a `DataTableComponent`.
3.  The component must accept two inputs:
    *   `data = input.required<any[]>()`
    *   `rowTemplate = input.required<TemplateRef<any>>()`
4.  The `DataTableComponent`'s template should contain a container (e.g., a `<div>` or `<table>`).
5.  Inside the container, use an `@for` block to loop over the `data()` signal.
6.  For each item in the loop, use `<ng-container>` with `[ngTemplateOutlet]` to render the `rowTemplate()`.
7.  **This is the most important step:** You must provide a *context object* to the template outlet. The context object should expose the current item from the loop to the template. The standard convention is to use the implicit variable, so the parent can use `let-item`.
    *   `[ngTemplateOutletContext]="{ $implicit: item }"`
8.  In your `AppComponent`, create an array of objects. For example:
    ```typescript
    users = signal([
      { id: 1, name: 'George', role: 'Admin', status: 'active' },
      { id: 2, name: 'Alice', role: 'Editor', status: 'inactive' },
      { id: 3, name: 'Bob', role: 'Viewer', status: 'active' }
    ]);
    ```
9.  Use your `<app-data-table>` component, passing the `users` signal to the `data` input.
10. In `AppComponent`, define an `<ng-template>` with a reference variable (e.g., `#userRow`).
11. **Use the `let-` syntax** in the template definition to capture the contextual data passed from the `DataTableComponent`. For example: `<ng-template #userRow let-user>`.
12. Inside your row template, display the user's data in a custom layout (e.g., show the name in an `<h2>`, the role in a `<p>`, and a colored badge based on the `status`). This proves you are successfully receiving the context.

### What to Have Ready
Show your `data-table.component.ts`/`.html` and `app.component.ts`/`.html`. You must be able to explain exactly how the context object in `ngTemplateOutletContext` connects to the `let-user` syntax in the parent template. Explain what `$implicit` means and how you would pass multiple variables (like `$index`).
