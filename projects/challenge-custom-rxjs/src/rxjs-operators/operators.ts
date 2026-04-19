import {defer, finalize, Observable, OperatorFunction, retry, retryWhen, throwError, timer} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

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

/*challenge - 1

Operator 1: retryWithBackoff<T>
What it does:
Retries a failed observable with exponential backoff delay. After each failure, wait longer before retrying. After max retries, throw the error.

Signature:

retryWithBackoff<T>(maxRetries: number, baseDelayMs: number): OperatorFunction<T, T>
Behavior:

Retry 1 → wait baseDelayMs * 1
Retry 2 → wait baseDelayMs * 2
Retry 3 → wait baseDelayMs * 4
After maxRetries attempts → throw the original error
Do NOT retry 4xx HTTP errors — only retry network errors (status 0) and 5xx
Usage:

this.http.get('/api/data').pipe(
  retryWithBackoff(3, 1000)
).subscribe();
Hint: retry({ count, delay }) or retryWhen + mergeMap + timer

*/
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



