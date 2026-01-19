# COMBINED CHALLENGE: The Composable Panel

### Your Persona
You are an Angular developer tasked with creating a highly reusable UI component. You must decide on the best composition strategy for different parts of the component.

### The Learning Goal
Master the use of both `<ng-content>` and `<ng-template>` with `ngTemplateOutlet` within a single component. You will learn to differentiate between a "default" content slot and specific, named template slots, and build a component that supports both simple and complex projection patterns.

### The Scenario
You will build a single, highly reusable `PanelComponent`. This component needs to be simple enough to just wrap a block of text, but also powerful enough to be structured with a distinct header and footer (like a confirmation dialog). This requires a hybrid approach to content projection.

### The Requirements

**1. Build the `PanelComponent`**
*   It **must** be `standalone: true`.
*   Its template must define a root element with a class, e.g., `class="panel"`.
*   **Default Content:** It must have one default projection slot for the main body of the panel using `<ng-content>`.
*   **Named Slots:** It must accept two optional `TemplateRef` inputs: `header` and `footer`.
*   **Conditional Rendering:** The component should only render the header and footer sections **if** the corresponding templates are actually provided by the parent. You will need to wrap your `ngTemplateOutlet` containers in an `@if` block.
*   **(Bonus) Theming:** Add a `theme` input that accepts `'primary'` or `'warning'`. The component should apply a different style (e.g., `border-left-color`) based on this theme.

**2. Implement in `AppComponent`**
You will create three instances of your `PanelComponent` to demonstrate its flexibility.

*   **Instance 1: Simple Content**
    *   Create a panel with the `'primary'` theme.
    *   This instance should **only** use `<ng-content>`. Simply put a paragraph of text inside the `<app-panel>` tags.
    *   Do **not** provide a `header` or `footer` template.

*   **Instance 2: Fully Structured Content**
    *   Create a panel with the `'warning'` theme.
    *   This instance should **not** use `<ng-content>` (i.e., leave the space between the `<app-panel>` tags empty).
    *   Define two templates, `#warningHeader` and `#warningFooter`.
    *   The header should contain a title like `<h2>Warning: Action Required</h2>`.
    *   The footer should contain two action buttons.
    *   Pass these templates to the `header` and `footer` inputs of the panel.

*   **Instance 3: Hybrid Content**
    *   Create a third panel with the `'primary'` theme.
    *   This instance must use **both** `<ng-content>` for its main body (e.g., put some form fields in it) **and** a template for the `footer` slot (e.g., a "Submit" button).
    *   Do **not** provide a `header` template.

### What to Have Ready
Show your `panel.component.ts/html/scss` and your `app.component.html`. Be ready to defend your implementation and explain:
1.  Why is `<ng-content>` a good choice for the "default" body content?
2.  Why is `ngTemplateOutlet` required for the optional `header` and `footer`?
3.  How did you achieve the conditional rendering of the header and footer slots?
