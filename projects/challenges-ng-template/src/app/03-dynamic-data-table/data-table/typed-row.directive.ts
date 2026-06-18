import {Directive, input} from '@angular/core';

/**
 * TypedRow — a compile-time only directive for generic row template type safety.
 *
 * Problem: Angular's ngTemplateContextGuard only fires when a directive is applied
 * directly to an <ng-template>. When a TemplateRef is passed as an input to a
 * component, the let- variables in the parent template cannot be narrowed — they
 * remain typed as `any`.
 *
 * Solution: Apply this directive to the <ng-template> in the parent alongside the
 * data array via [typedRow]="items". The directive carries no runtime logic — it
 * exists purely so the Angular template type checker knows to call ngTemplateContextGuard
 * and narrow { $implicit: T; index: number } from the data type.
 *
 * @see https://angular.dev/guide/directives/structural-directives#typing-the-directives-context
 */
@Directive({ selector: 'ng-template[typedRow]' })
export class TypedRow<T> {
  readonly typedRow = input.required<T[]>();

  static ngTemplateContextGuard<T>(
    dir: TypedRow<T>,
    ctx: unknown
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
