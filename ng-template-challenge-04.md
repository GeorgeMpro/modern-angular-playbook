# ng-template Challenge #4: Dynamic Layout Composition

**Difficulty:** Medium–Hard
**Angular Version:** 22+
**Focus:** Template slots as signals, `computed()` template selection, decoupled shell architecture

---

## The Problem

A layout shell (sidebar + main area) shouldn't know what goes inside it. The app shell defines regions; the page decides what fills them. When the user switches between "Stats" and "Inventory" in the sidebar, the layout component should be unaware — it just renders whatever template it receives.

This is how Angular Material's `mat-sidenav`, `router-outlet`, and tab components work: the shell defines structure, the parent controls content.

---

## Task

Build a `PageLayoutComponent` that defines a two-column layout and renders whatever templates it receives — it has no knowledge of "stats", "inventory", or "game board".

### PageLayoutComponent

```ts
readonly mainSlot = input.required<TemplateRef<void>>();
readonly sideSlot = input<TemplateRef<void> | null>(null);
```

```html
<div class="layout">
  <main class="layout-main">
    <ng-container [ngTemplateOutlet]="mainSlot()" />
  </main>
  @if (sideSlot()) {
    <aside class="layout-side">
      <ng-container [ngTemplateOutlet]="sideSlot()" />
    </aside>
  }
</div>
```

### AppComponent

Define the state and all templates in the parent:

```ts
type SidePanelContent = 'stats' | 'inventory';
readonly sidePanelState = signal<SidePanelContent>('stats');

readonly activeSideTemplate = computed(() =>
  this.sidePanelState() === 'stats' ? this.statsTpl() : this.inventoryTpl()
);

// Query the templates defined in the component's own view
readonly statsTpl     = viewChild.required<TemplateRef<void>>('playerStats');
readonly inventoryTpl = viewChild.required<TemplateRef<void>>('inventory');
```

```html
<!-- Template definitions — not rendered until referenced -->
<ng-template #gameBoard>
  <h2>Game Board</h2>
  <p>Main play area here.</p>
</ng-template>

<ng-template #playerStats>
  <p>Health: 80/100</p>
  <p>Mana: 45/60</p>
</ng-template>

<ng-template #inventory>
  <ul>
    <li>Sword +2</li>
    <li>Health Potion x3</li>
  </ul>
</ng-template>

<app-page-layout
  [mainSlot]="gameBoard"
  [sideSlot]="activeSideTemplate()" />

<button (click)="sidePanelState.set('stats')">Show Stats</button>
<button (click)="sidePanelState.set('inventory')">Show Inventory</button>
```

### Behavior

- Clicking "Show Stats" swaps the sidebar content — `PageLayoutComponent` does not update, only the template reference it receives changes
- `PageLayoutComponent` has zero knowledge of "stats" or "inventory"
- The main slot never changes
- If `sideSlot` is `null`, the sidebar DOM node is absent entirely

### What you'll learn

`viewChild<TemplateRef<void>>('gameBoard')` is the v22 signal API for querying elements in a component's own template by reference variable. Use it (not `@ViewChild`) to get `TemplateRef` objects and pass them programmatically.

`computed()` template selection: when `sidePanelState` changes, `activeSideTemplate` recomputes, which changes the value passed to `[sideSlot]`, which triggers `PageLayoutComponent` to re-render with the new template. The layout component is passive — it reacts to its inputs.

This is the architecture of every serious Angular shell: layout owns structure, parent owns content, signals own state.

### Extension

Add a third panel: `'achievements'`. Adding it requires:
- One new `<ng-template #achievements>` in the parent
- One new `viewChild` query
- One additional `case` in `computed()` (or extend the dispatch table)
- Zero changes to `PageLayoutComponent`

That's the Open/Closed Principle applied to templates.

### Hint

`viewChild` queries the component's own template (its view). `contentChild` queries projected content (what the parent puts between the component's tags). For templates defined in `app.component.html` and used within `app.component.html`, use `viewChild`.

---

## Acceptance Criteria

- [ ] `PageLayoutComponent` has no knowledge of "stats", "inventory", or "game board"
- [ ] `computed()` drives which template is active — no `@if` chains in the parent template for slot selection
- [ ] `viewChild()` used to get `TemplateRef` references (not `@ViewChild`)
- [ ] Sidebar DOM node is absent when `sideSlot` is `null`
- [ ] Extension: third panel added with zero changes to `PageLayoutComponent`
