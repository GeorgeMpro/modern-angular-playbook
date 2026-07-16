import {Directive, effect, EmbeddedViewRef, inject, input, TemplateRef, ViewContainerRef} from '@angular/core';
import {catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';

export interface AsyncContext<T> {
  $implicit: T | null;
  loading: boolean;
  error: unknown;
}

@Directive({
  selector: '[appAsync]',
})
export class AppAsync<T> {

  private embeddedViewRef: EmbeddedViewRef<AsyncContext<T>> | undefined;
  private readonly loadingContext: AsyncContext<T> = {$implicit: null, loading: true, error: null}

  private readonly vcr = inject(ViewContainerRef);
  private readonly tmpl = inject(TemplateRef<AsyncContext<T>>);

  readonly appAsync = input.required<Observable<T>>();

  private readonly stream$ = toObservable(this.appAsync);
  private readonly asyncContext$ = this.stream$.pipe(
    switchMap((val: Observable<T>): Observable<AsyncContext<T>> => {
      return this.toAsyncContext(val);
    })
  );

  private toAsyncContext(val: Observable<T>): Observable<AsyncContext<T>> {
    return val.pipe(
      map(v => {
        const state: AsyncContext<T> = {$implicit: v, loading: false, error: null};
        return state;
      }),
      catchError(err => {
        const state: AsyncContext<T> = {$implicit: null, loading: false, error: err};
        return of(state);
      }),
      startWith(this.loadingContext)
    );
  }

  // toSignal ties its subscription to this directive's DestroyRef automatically —
  // no manual takeUntilDestroyed() needed.
  readonly asyncContext = toSignal(this.asyncContext$, {
    initialValue: this.loadingContext
  });

  static ngTemplateContextGuard<T>(dir: AppAsync<T>, ctx: any): ctx is AsyncContext<T> {
    return true;
  }

  constructor() {
    effect(() => {
      const ctx = this.asyncContext();

      if (!this.embeddedViewRef) {
        this.embeddedViewRef = this.vcr.createEmbeddedView(this.tmpl, {...ctx});
      } else {
        const viewCtx = this.embeddedViewRef.context;
        this.updateContext(viewCtx, ctx);
        this.embeddedViewRef.markForCheck()
      }
    });
  }

  private updateContext(viewCtx: AsyncContext<T>, currCtx: AsyncContext<T>) {
    viewCtx.$implicit = currCtx.$implicit;
    viewCtx.loading = currCtx.loading;
    viewCtx.error = currCtx.error;
  }
}
