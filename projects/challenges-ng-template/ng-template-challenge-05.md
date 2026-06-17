# ng-template Challenge #5: Recursive Folder Explorer

**Difficulty:** Hard
**Angular Version:** 22+
**Focus:** Self-referencing `ngTemplateOutlet`, recursive context, depth-aware rendering

---

## The Problem

You have a nested data structure — folders that contain folders. The naive solution is a recursive component: `FolderComponent` renders a list of children, each of which is another `FolderComponent`. That works, but it creates a new component instance per node, which is expensive for deep trees.

The alternative: a single `<ng-template>` that calls itself. One template definition, zero extra components, unlimited depth.

---

## Data Shape

```ts
interface TreeNode {
  id: number;
  name: string;
  children: TreeNode[];
}

readonly tree = signal<TreeNode[]>([
  {
    id: 1, name: 'src', children: [
      {
        id: 2, name: 'app', children: [
          { id: 3, name: 'components', children: [] },
          { id: 4, name: 'services',   children: [] },
        ]
      },
      { id: 5, name: 'assets', children: [
          { id: 6, name: 'icons', children: [] },
        ]
      },
    ]
  },
  { id: 7, name: 'public', children: [] },
]);
```

---

## Task

Build a `FolderExplorerComponent` that renders the full tree using a **single `<ng-template>`** — no child components.

### The recursive template

```html
<ng-template #node let-folder let-depth="depth">
  <div [style.padding-left.px]="depth * 20" class="node">
    📁 {{ folder.name }}
  </div>
  @for (child of folder.children; track child.id) {
    <ng-container
      [ngTemplateOutlet]="node"
      [ngTemplateOutletContext]="{ $implicit: child, depth: depth + 1 }" />
  }
</ng-template>
```

Bootstrap it for each root node:

```html
@for (root of tree(); track root.id) {
  <ng-container
    [ngTemplateOutlet]="node"
    [ngTemplateOutletContext]="{ $implicit: root, depth: 0 }" />
}
```

### Why this works

`#node` is a `TemplateRef`. Inside the template, `[ngTemplateOutlet]="node"` refers to that same `TemplateRef` — Angular resolves it from the same view. Each call passes a child node and increments `depth`, so the recursion terminates naturally when `folder.children` is empty and `@for` produces nothing.

### Context

| Key | Type | Description |
|---|---|---|
| `$implicit` | `TreeNode` | The current folder (read with bare `let-folder`) |
| `depth` | `number` | Nesting level, starts at `0` for roots |

---

## Behavior

- Entire tree renders from a single template definition
- Each level is indented 20px more than its parent
- Adding a node to `tree()` re-renders without touching the template
- No `FolderNodeComponent`, no recursion in TypeScript — only in the template

---

## Extension

Add a collapse toggle: clicking a folder hides/shows its children.

```ts
readonly collapsed = signal<Set<number>>(new Set());

toggle(id: number): void {
  this.collapsed.update(set => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

Pass `collapsed` as a named context variable so the template can read it:

```html
[ngTemplateOutletContext]="{ $implicit: child, depth: depth + 1, collapsed: collapsed() }"
```

```html
<ng-template #node let-folder let-depth="depth" let-collapsed="collapsed">
  <div [style.padding-left.px]="depth * 20" class="node" (click)="toggle(folder.id)">
    {{ collapsed.has(folder.id) ? '▶' : '▼' }} {{ folder.name }}
  </div>
  @if (!collapsed.has(folder.id)) {
    @for (child of folder.children; track child.id) {
      <ng-container
        [ngTemplateOutlet]="node"
        [ngTemplateOutletContext]="{ $implicit: child, depth: depth + 1, collapsed: collapsed }" />
    }
  }
</ng-template>
```

### What you'll learn

A `TemplateRef` is just an object — you can pass it as context data or reference it from within itself. Recursion in templates terminates the same way recursion in functions does: a base case where nothing is produced (`@for` over an empty array emits nothing).

The `depth` context variable illustrates how to thread accumulating state through recursive template calls without any component state — the template is stateless, the caller provides everything it needs.

---

## Acceptance Criteria

- [ ] Single `<ng-template #node>` — no recursive component
- [ ] Full tree renders to arbitrary depth
- [ ] Indentation increases with `depth`
- [ ] `TreeNode` type used throughout — no `any`
- [ ] Extension: collapse/expand works per node, not globally
