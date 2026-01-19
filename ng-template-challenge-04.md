# NG-TEMPLATE CHALLENGE #4: UI Composition and Dynamic Outlets

### Your Persona
You have mastered `ngTemplateOutlet` and passing context. You are ready to architect a complex, dynamic UI layout by composing it from multiple, swappable template pieces.

### The Learning Goal
Demonstrate mastery by composing a complete UI layout from multiple, independent template "slots". You will also dynamically change which template is being passed into a slot based on application state. This is a pattern used to build highly configurable dashboards, app shells, and complex views.

### The Scenario
You will build the main layout shell for a simple game UI. The layout component itself will be dumb; it will only define regions. The main application component will own all the pieces—the game board, the player stats, the inventory—and will tell the layout component what to render and where. It will also dynamically swap the content of the sidebar.

### The Requirements
1.  All components must be `standalone` and use modern Angular syntax. All state must be in signals.
2.  Create a `PageLayoutComponent`. Its template should define a simple two-column structure (e.g., a main content area and a smaller sidebar area).
3.  The `PageLayoutComponent` must accept two `TemplateRef` inputs:
    *   `mainSlot = input.required<TemplateRef<any>>()`
    *   `sideSlot = input<TemplateRef<any> | null>()` (make it optional)
4.  Use `ngTemplateOutlet` in the appropriate places to render the `mainSlot` and `sideSlot` templates.
5.  In your `AppComponent`, create a signal to manage the state of the sidebar.
    ```typescript
    type SidePanelContent = 'stats' | 'inventory';
    sidePanelState = signal<SidePanelContent>('stats');
    ```
6.  In `app.component.html`, define **three** distinct `<ng-template>` blocks with reference variables:
    *   `#gameBoard`: Contains a placeholder for the main game area.
    *   `#playerStats`: Contains placeholder stats for the player (Health, Mana, etc.).
    *   `#inventory`: Contains a placeholder for a list of items.
7.  Use your `<app-page-layout>` component.
    *   The `mainSlot` input should always be bound to the `#gameBoard` template.
    *   The `sideSlot` input must be bound **dynamically**. Use an `@if` block or a `computed` signal to pass the `#playerStats` template if `sidePanelState()` is `'stats'`, and the `#inventory` template if it's `'inventory'`.
8.  Add two buttons in `AppComponent` to "Show Stats" and "Show Inventory". Clicking these buttons should change the `sidePanelState` signal, which will cause your layout to dynamically swap the content in the sidebar without the layout component itself knowing anything about "stats" or "inventory".

### What to Have Ready
Show all relevant component and template files. Be prepared to explain the full flow of data and templates. How does a state change in the `AppComponent` trigger a view change inside the `PageLayoutComponent`? Explain the power of this pattern for decoupling a "shell" or "layout" component from the content it displays. This is a critical pattern for large-scale applications.
