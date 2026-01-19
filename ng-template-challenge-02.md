# NG-TEMPLATE CHALLENGE #2: Configurable Modal with Template Outlets

### Your Persona
You've just learned basic content projection with `<ng-content>` and you're ready for a real challenge. You need to build a truly reusable component.

### The Learning Goal
Learn to create a flexible, reusable component that accepts specific UI sections as inputs using `<ng-template>` and the `ngTemplateOutlet` directive. This is the first major step into the power of template composition.

### The Scenario
`<ng-content>` is too blunt of an instrument for complex components. You can't project content into multiple, specific locations. You're going to build a `ModalComponent` that is just a shell, and the parent will provide templates for the header, body, and footer, making it highly reusable for any purpose.

### The Requirements
1.  All components **must** be `standalone: true` and use modern `@if`/`@for` syntax.
2.  Create a `ModalComponent`. It should have a signal to control its visibility (e.g., `isOpen = signal(false)`), along with `open()` and `close()` methods.
3.  The component's template will have the basic modal structure (e.g., a backdrop and a modal panel).
4.  The `ModalComponent` **must not** have any hardcoded header, body, or footer content.
5.  It **must** accept three inputs of type `TemplateRef<any>`:
    *   `headerTemplate: InputSignal<TemplateRef<any>>`
    *   `bodyTemplate: InputSignal<TemplateRef<any>>`
    *   `footerTemplate: InputSignal<TemplateRef<any>>`
6.  Inside the modal's structure, use `<ng-container [ngTemplateOutlet]="headerTemplate()">` (and so on for the body and footer) to render the templates provided by the parent.
7.  In your `AppComponent`, create two different buttons that each open a unique modal.
8.  **Modal 1 (Confirm Deletion):**
    *   Define three `<ng-template>` elements in `app.component.html`, each with a template reference variable (e.g., `#confirmHeader`, `#confirmBody`, `#confirmFooter`).
    *   The header should say "Confirm Deletion".
    *   The body should contain a warning message.
    *   The footer should contain "Yes, delete" and "Cancel" buttons.
    *   Pass these templates to an instance of your `<app-modal>`.
9.  **Modal 2 (User Login):**
    *   Define three more `<ng-template>` elements (e.g., `#loginHeader`, `#loginBody`, `#loginFooter`).
    *   The header should say "User Login".
    *   The body should contain `<input>` fields for username and password.
    *   The footer should contain a "Log In" button.
    *   Pass these templates to a second, separate instance of your `<app-modal>`.

### What to Have Ready
Show your `modal.component.ts`/`.html` and your `app.component.ts`/`.html`. Be ready to explain why `ngTemplateOutlet` is superior to `ng-content` for this scenario and how `TemplateRef` acts like passing a function definition for the UI.
