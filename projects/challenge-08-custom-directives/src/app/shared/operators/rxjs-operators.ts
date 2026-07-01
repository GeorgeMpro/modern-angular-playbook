import {WritableSignal} from '@angular/core';

import {finalize, MonoTypeOperatorFunction, Observable, tap} from 'rxjs';

export function withLoading<T>(isLoading: WritableSignal<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => source.pipe(
    tap({subscribe: () => isLoading.set(true)}),
    finalize(() => isLoading.set(false))
  );
}
