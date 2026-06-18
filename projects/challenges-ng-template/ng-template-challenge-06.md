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

## Task

Build this system so that a template defined in `AppComponent` can access a service that is only provided inside `PageLayoutComponent`.

### The scoped service

`LayoutThemeService` holds a `'light' | 'dark'` theme signal and a `toggle()` method. It is **not** `providedIn: 'root'` — it is only provided in `PageLayoutComponent`'s `providers` array.

### PageLayoutComponent

- Provides `LayoutThemeService` locally
- Accepts a `contentSlot` template input
- Renders the template using `ngTemplateOutlet` + `ngTemplateOutletInjector`
- Has a theme toggle button that calls the service directly
- Injects its own `Injector` and passes it to `[ngTemplateOutletInjector]`

### AppComponent

- Defines a `<ng-template>` that displays the current theme
- Passes that template to `PageLayoutComponent` via `[contentSlot]`
- Does **not** inject `LayoutThemeService` itself — it has no access to it

### Directive approach

Since the template can't receive a service directly as a `let-` variable, use a directive inside the template that injects the service from the outlet's injector. The directive exposes the service's state as a property the template can read via a template reference variable.

Without `[ngTemplateOutletInjector]`, the directive fails — Angular looks in the creation context and finds nothing. With it, Angular uses the outlet's injector and resolves the service.

---

## Behavior

- Theme toggle button (inside `PageLayoutComponent`) updates the service
- The `<ng-template>` defined in `AppComponent` reflects the current theme in real time
- Remove `[ngTemplateOutletInjector]` → `NullInjectorError` for `LayoutThemeService`
- Add it back → resolves correctly

---

## What you'll learn

Every Angular injector forms a tree. When a template is instantiated, Angular must choose which node in that tree to start from. The default is the **definition site** — where the `<ng-template>` lives in source. `ngTemplateOutletInjector` overrides that to the **outlet site** — where `ngTemplateOutlet` is applied.

This matters any time you render a parent-defined template inside a child that provides local services: portals, layout shells, tab containers, dialog hosts.

| | Creation context (default) | Outlet context (`ngTemplateOutletInjector`) |
|---|---|---|
| Template defined in | `AppComponent` | `AppComponent` |
| Injector used | `AppComponent`'s | `PageLayoutComponent`'s |
| Can inject `LayoutThemeService` | No | Yes |

---

## Acceptance Criteria

- [ ] `LayoutThemeService` has no `providedIn` — provided only in `PageLayoutComponent`
- [ ] The directive successfully injects `LayoutThemeService` when the outlet injector is set
- [ ] Removing `[ngTemplateOutletInjector]` causes a `NullInjectorError`
- [ ] The template-defined content reflects live theme changes driven by the button inside `PageLayoutComponent`
- [ ] No `LayoutThemeService` injection in `AppComponent` itself
