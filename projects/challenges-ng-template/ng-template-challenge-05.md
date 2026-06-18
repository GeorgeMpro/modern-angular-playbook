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
```

Seed the component with a tree at least 3 levels deep to verify recursion works.

---

## Task

Build a `FolderExplorerComponent` that renders the full tree using a **single `<ng-template>`** — no child components.

### The recursive template

The template receives the current node via context. For each child, it renders the same template again with the child as the new `$implicit` and an incremented `depth` value. Recursion terminates naturally when a node has no children — `@for` over an empty array produces nothing.

Pass `depth` as a named context variable alongside `$implicit` so the template can use it for indentation. Start depth at `0` for root nodes.

### Behavior

- Entire tree renders from a single template definition
- Each level is indented more than its parent (use `depth` to calculate `padding-left`)
- Adding a node to the signal re-renders without touching the template
- No `FolderNodeComponent`, no recursion in TypeScript — only in the template

### What you'll learn

A `TemplateRef` is just an object — you can reference it from within itself. Recursion in templates terminates the same way recursion in functions does: a base case where nothing is produced (`@for` over an empty array emits nothing).

The `depth` context variable illustrates how to thread accumulating state through recursive template calls without any component state — the template is stateless, the caller provides everything it needs.

---

## Extension

Add a collapse toggle: clicking a folder hides/shows its children.

- Track collapsed nodes by id in a `signal<Set<number>>`
- A `toggle(id)` method adds/removes from the set immutably
- Pass the collapsed set as a named context variable so the template can read it at any depth
- Each node independently shows/hides its children

---

## Acceptance Criteria

- [ ] Single `<ng-template>` — no recursive component
- [ ] Full tree renders to arbitrary depth
- [ ] Indentation increases with `depth`
- [ ] `TreeNode` type used throughout — no `any`
- [ ] Extension: collapse/expand works per node, not globally
