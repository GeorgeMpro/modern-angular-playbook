import {defer, finalize, Observable, OperatorFunction, retry, tap, throwError, timer} from 'rxjs';

import {HttpErrorResponse} from '@angular/common/http';
import {WritableSignal} from '@angular/core';

export function callTimer<T>(label: string, callback?: (time: number) => void) {
  return (source: Observable<T>) => defer(() => {
    const start = performance.now();
    return source.pipe(
      finalize(() => {
        const elapsed = performance.now() - start;
        console.log(`[Timer] ${label}:${elapsed.toFixed(2)}ms`);
        if (callback) {
          callback(elapsed);
        }
      }));
  });
}

export function retryWithBackoff<T>(maxRetries: number, baseDelayMs: number): OperatorFunction<T, T> {
  return (source$: Observable<T>) => {
    return source$.pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          console.warn(`Attempt ${retryCount}`);
          if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          return timer(baseDelayMs * retryCount);
        }
      }),
    )
  }
}


export function withLoading<T>(loadingSignal: WritableSignal<boolean>): OperatorFunction<T, T> {
  return (source: Observable<T>) => defer(() => {
    loadingSignal.set(true);
    return source.pipe(
      finalize(() => loadingSignal.set(false)
      ));

  });
}


export function tapOnce<T>(fn: (value: T) => void): OperatorFunction<T, T> {
  return (source$: Observable<T>) => defer(() => {
      let isFirst = true;
      return source$.pipe(
        tap(value => {
          if (isFirst) {
            fn(value);
            isFirst = false;
          }
        })
      );
    }
  )
}
