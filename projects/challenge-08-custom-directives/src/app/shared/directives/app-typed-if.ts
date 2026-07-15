import {Directive, effect, inject, input, TemplateRef, ViewContainerRef} from '@angular/core';

// Notice: $implicit backs `let u`; appTypedIf backs `let u = appTypedIf` (named form).
// Both point at the same narrowed value — see TypedIfContext<T>.
export interface TypedIfContext<T> {
  $implicit: T;
  appTypedIf: T;
}

@Directive({
  selector: '[appTypedIf]',
})
export class AppTypedIf<T> {
  private readonly vcr = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef<TypedIfContext<T>>);

  readonly appTypedIf = input<T | null | undefined>();

  static ngTemplateGuard_appTypedIf: 'binding';

  static ngTemplateContextGuard<T>(
    dir: AppTypedIf<T>,
    ctx: any
  ): ctx is TypedIfContext<T> {
    return true;
  }

  constructor() {
    effect(() => {
      this.vcr.clear();

      const parameter = this.appTypedIf();
      if (parameter) {
        this.vcr.createEmbeddedView(this.templateRef, {
          $implicit: parameter,
          appTypedIf: parameter
        });
      }
    });
  }
}
