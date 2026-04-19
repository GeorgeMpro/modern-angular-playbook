import {defer, finalize, MonoTypeOperatorFunction, Observable, of, retry, tap, throwError, timer} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {WritableSignal} from '@angular/core';


export function retryOnNetworkError<T>(
  onRetry?: (count: number, max: number) => void
): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => {
    const maxRetry = 4;
    return source$.pipe(
      retry({
        count: maxRetry,
        delay: (error, retryCount) => {
          const status = error.status;
          const serverErrors = status === 503 || status === 0 || status === 500;
          if (error instanceof HttpErrorResponse && serverErrors) {
            onRetry?.(retryCount, maxRetry);
            console.warn(`Attempting to reconnect. (${retryCount}/${maxRetry}) Attempt.`);
            return timer(Math.pow(2, retryCount - 1) * 1000);
          } else {
            return throwError(() => error);
          }
        }
      }));
  }
}

export function trackRequest<T>(flag: WritableSignal<boolean>): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => {
    // defer to handle setting the flag when the subscription happens
    return defer(() => {
      flag.set(true);
      return source$.pipe(
        finalize(() => flag.set(false))
      );
    })
  }
}
