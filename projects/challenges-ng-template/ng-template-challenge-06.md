# ng-template Challenge #6: Template Injector Scope

**Difficulty:** Hard
**Angular Version:** 22+
**Focus:** `ngTemplateOutletInjector`, creation-context vs outlet-context injectors, scoped service access from templates

---

## The Problem

A template is compiled in the component where it is *defined* — that's its **creation context**. By default, when Angular renders it via `ngTemplateOutlet`, it uses the creation context's injector to resolve any dependencies the template needs.

This breaks when:
- A template is defined in `AppComponent`
- It's rendered inside `PageLayoutComponent`
- `PageLayoutComponent` provides a service that the template needs
- The template can't find that service — it's looking in `AppComponent`'s injector, not `PageLayoutComponent`'s

The fix: `[ngTemplateOutletInjector]` — pass the outlet's injector explicitly so the template resolves dependencies from where it's *rendered*, not where it was *defined*.

---

## Setup

### The scoped service

```ts
@Injectable()
export class LayoutThemeService {
  readonly theme = signal<'light' | 'dark'>('light');
  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}
```

`LayoutThemeService` is **not** `providedIn: 'root'`. It is only provided inside `PageLayoutComponent`.

### PageLayoutComponent

```ts
@Component({
  selector: 'app-page-layout',
  providers: [LayoutThemeService],
  template: `
    <div [class]="themeService.theme()">
      <button (click)="themeService.toggle()">Toggle theme</button>
      <ng-container
        [ngTemplateOutlet]="contentSlot()"
        [ngTemplateOutletInjector]="injector" />
    </div>
  `
})
export class PageLayoutComponent {
  readonly contentSlot = input.required<TemplateRef<void>>();
  readonly themeService = inject(LayoutThemeService);
  readonly injector     = inject(Injector);
}
```

`inject(Injector)` captures `PageLayoutComponent`'s own injector. Passing it via `[ngTemplateOutletInjector]` makes the rendered template use this injector hierarchy — so it can find `LayoutThemeService`.

### AppComponent

Define a template that reads from `LayoutThemeService`:

```ts
@Component({
  selector: 'app-root',
  imports: [PageLayoutComponent],
  template: `
    <ng-template #content>
      <p>Current theme: {{ themeService.theme() }}</p>
    </ng-template>

    <app-page-layout [contentSlot]="content" />
  `
})
export class AppComponent {
  readonly themeService = inject(LayoutThemeService);
}
```

But this won't compile — `AppComponent` can't inject `LayoutThemeService` because it's not in `AppComponent`'s injector. The template must access the service itself, which means the template's injector must be able to reach it.

---

## Task

Build this system so that:

1. `LayoutThemeService` is provided **only** in `PageLayoutComponent`
2. `AppComponent` defines a `<ng-template #content>` that renders the current theme
3. The template accesses `LayoutThemeService` via a directive — not via the parent component
4. `[ngTemplateOutletInjector]` makes the outlet's injector available so the directive resolves correctly

### Directive approach

Since the template can't receive a service directly as a `let-` variable, use a directive inside the template that injects the service from the outlet's injector:

```ts
@Directive({ selector: '[themeDisplay]' })
export class ThemeDisplayDirective {
  private themeService = inject(LayoutThemeService);
  readonly theme = this.themeService.theme;
}
```

```html
<ng-template #content>
  <div themeDisplay #td="themeDisplay">
    Current theme: {{ td.theme() }}
  </div>
</ng-template>
```

Without `[ngTemplateOutletInjector]`, `ThemeDisplayDirective` fails to inject `LayoutThemeService` — Angular looks in the creation context (AppComponent) and finds nothing. With it, Angular uses the outlet's injector and finds the service provided by `PageLayoutComponent`.

---

## Behavior

- Theme toggle button (inside `PageLayoutComponent`) updates `LayoutThemeService`
- The `<ng-template>` defined in `AppComponent` reflects the current theme
- Remove `[ngTemplateOutletInjector]` → `NullInjectorError` for `LayoutThemeService`
- Add it back → resolves correctly

---

## What you'll learn

Every Angular injector forms a tree. When a template is instantiated, Angular must choose which node in that tree to start from. The default is the **definition site** — where the `<ng-template>` lives in source. `ngTemplateOutletInjector` overrides that to the **outlet site** — where `ngTemplateOutlet` is applied.

This matters any time you render a parent-defined template inside a child that provides local services: portals, layout shells, tab containers, dialog hosts. Without the injector override, the template is blind to everything the outlet provides.

### Creation context vs outlet context

| | Creation context (default) | Outlet context (`ngTemplateOutletInjector`) |
|---|---|---|
| Template defined in | `AppComponent` | `AppComponent` |
| Injector used | `AppComponent`'s | `PageLayoutComponent`'s |
| Can inject `LayoutThemeService` | No | Yes |

---

## Acceptance Criteria

- [ ] `LayoutThemeService` has no `providedIn` — provided only in `PageLayoutComponent`
- [ ] `ThemeDisplayDirective` successfully injects `LayoutThemeService` when the outlet injector is set
- [ ] Removing `[ngTemplateOutletInjector]` causes a `NullInjectorError` (prove you understand why)
- [ ] The template-defined content reflects live theme changes driven by the button inside `PageLayoutComponent`
- [ ] No `LayoutThemeService` injection in `AppComponent` itself
