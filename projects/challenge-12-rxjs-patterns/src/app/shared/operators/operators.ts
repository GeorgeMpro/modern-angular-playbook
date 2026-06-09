import {WritableSignal} from '@angular/core';

import {
  catchError,
  defer,
  EMPTY,
  finalize,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  retry,
  scan,
  timer
} from 'rxjs';

export function withLoading<T>(isLoading: WritableSignal<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => defer(() => {
    isLoading.set(true);
    return source.pipe(
      finalize(() => isLoading.set(false))
    );
  });
}

export function gatherArray<T>(): OperatorFunction<T, T[]> {
  return (source$: Observable<T>) => {
    return source$.pipe(
      scan((acc: T[], curr) => {
        return [...acc, curr];
      }, []),
      catchError(() => EMPTY)
    )
  }
}

export function retryWithBackoff<T>(
  maxRetries: number,
  baseDelayMs: number,
  onRetry?: (retryCount: number) => void): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => {
    return source$.pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          onRetry?.(retryCount);
          return timer(baseDelayMs * retryCount)
        }
      }),
    );
  };
}
