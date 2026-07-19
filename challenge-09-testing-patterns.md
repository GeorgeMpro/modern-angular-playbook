# Challenge #9: Testing Patterns

**Difficulty:** Hard
**Angular Version:** 22+
**Focus:** Testing real production code — RxJS operators, HTTP interceptors, signal services, structural directives

---

## Context

Tests on a CV mean nothing without code to back them up. This challenge builds a real test suite against the code you already wrote in Ch11, Ch12, and Ch08 — not toy examples.

The four targets cover the four most important testing patterns in Angular:

| Target | Pattern |
|---|---|
| `ToastService` (Ch11) | Signal service — state, timers, side effects |
| RxJS operators (Ch11 + Ch12) | Operator behavior — retry logic, signal lifecycle |
| `errorInterceptor` (Ch11) | HTTP interceptor — `HttpTestingController` pipeline |
| `appPermission` (Ch08) | Structural directive — host component wrapper, DOM |

None of these use toy components. If a test passes, it means real code works correctly.

---

## Setup

Angular 22 uses Jasmine + Karma by default. No Vitest config needed — run tests with:

```bash
ng test challenge-11-centralized-error-handling
ng test challenge-12-rxjs-patterns
ng test challenge-08-custom-directives
```

### Key imports for v22

```ts
// HTTP testing — use this, NOT HttpClientTestingModule
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

// RxJS test utilities
import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { defer, of, throwError } from 'rxjs';

// Angular HTTP errors
import { HttpErrorResponse } from '@angular/common/http';
```

**Rule:** `HttpClientTestingModule` is deprecated. Always use `provideHttpClient()` + `provideHttpClientTesting()` together in the `providers` array.

---

## Part 1: Signal Service — `ToastService`

**File:** `challenge-11-centralized-error-handling/src/app/services/toast-service.ts`

### Why start here

No HTTP, no directives — just a service with signal state, a timer Map, and action dispatch logic. The cleanest entry point to learn what signal testing actually looks like.

### The hidden setup problem

`ToastService` pre-loads `dummyMessages` in its constructor. Every test will see 8 toasts already present unless you clear them in `beforeEach`. Figure out how to start each test with an empty queue.

### Scaffold

```ts
// toast-service.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast-service';
import { ToastMessage } from '../shared/toast.model';

describe('ToastService', () => {
  let service: ToastService;
t
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);

    // TODO: clear pre-loaded dummyMessages so tests start with an empty queue
  });

  describe('addToast', () => {
    it('should append the toast to the toasts signal', () => {
      // TODO
    });

    it('should assign an incrementing id to each toast', () => {
      // TODO: add two toasts, verify ids are different and increasing
    });

    it('should assign STATUS_ACTIONS based on toast type', () => {
      // TODO: error toast → actions include 'retry' and 'dismiss'
      //       success toast → actions include 'undo' and 'dismiss'
      //       info toast → actions include 'dismiss' only
    });

    it('should auto-dismiss after the specified duration', fakeAsync(() => {
      // TODO: add a toast with duration 2000
      //       tick(1999) — still present
      //       tick(1) — gone
    }));
  });

  describe('dismissToast', () => {
    it('should remove the toast from the signal', () => {
      // TODO
    });

    it('should not auto-dismiss after manual dismiss (timer cleared)', fakeAsync(() => {
      // TODO: add toast, manually dismiss it, tick past duration
      //       verify no error thrown and toast stays absent
    }));
  });
});
```

### What you'll learn

Signals are plain values in tests — read them with `service.toasts()`, no async needed. `fakeAsync` + `tick(ms)` controls `setTimeout` without waiting real time. The dummyMessages setup problem is a real production concern: services that have side effects in constructors require deliberate test isolation.

---

## Part 2: Custom RxJS Operators

These operators are pure functions — no TestBed required. Test them by subscribing directly.

### 2a: `retryOnNetworkError` (Ch11)

**File:** `challenge-11-centralized-error-handling/src/app/shared/rxjs-operators.ts`

The operator retries on status 503, 500, and 0. It passes 4xx errors through immediately. After `maxRetry` (4) attempts it gives up and propagates the error.

**Test cases:**

```ts
import { fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { defer, throwError } from 'rxjs';
import { retryOnNetworkError } from './rxjs-operators';

describe('retryOnNetworkError', () => {

  it('should retry on status 503', fakeAsync(() => {
    let callCount = 0;
    const source$ = defer(() => {
      callCount++;
      return throwError(() => new HttpErrorResponse({ status: 503 }));
    }).pipe(retryOnNetworkError());

    source$.subscribe({ error: () => {} });

    // TODO: tick through all exponential delays (1s, 2s, 4s, 8s)
    //       assert callCount === 5 (1 original + 4 retries)
  }));

  it('should NOT retry on status 404', fakeAsync(() => {
    // TODO: 404 should fail immediately — callCount === 1
  }));

  it('should NOT retry on status 400', fakeAsync(() => {
    // TODO: same — 4xx is not a network error
  }));

  it('should call onRetry with correct (count, max) on each attempt', fakeAsync(() => {
    // TODO: spy on onRetry callback, tick delays, assert called with
    //       (1, 4), (2, 4), (3, 4), (4, 4)
  }));

  it('should propagate the error after maxRetry exhausted', fakeAsync(() => {
    // TODO: assert error emitted to subscriber after all retries fail
  }));

  it('should use exponential backoff delays', fakeAsync(() => {
    // TODO: subscribe and use tick() selectively to prove the delays are
    //       2^0 * 1000 = 1s, 2^1 * 1000 = 2s, 2^2 * 1000 = 4s, 2^3 * 1000 = 8s
  }));
});
```

**What you'll learn**

`defer` re-executes the factory on each retry — without it, a cold observable would only error once and the retry count would always be 1. This is the correct way to test retry operators: count factory invocations, not subscriber callbacks.

---

### 2b: `trackRequest` (Ch11)

**File:** `challenge-11-centralized-error-handling/src/app/shared/rxjs-operators.ts`

`trackRequest` uses `defer` + `finalize`. The signal must go `false` in all three teardown paths: complete, error, and unsubscribe.

```ts
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { trackRequest } from './rxjs-operators';

describe('trackRequest', () => {
  it('should set the signal to true on subscribe', () => {
    // TODO
  });

  it('should set the signal to false on complete', () => {
    // TODO
  });

  it('should set the signal to false on error', () => {
    // TODO: subscribe with an error handler, assert signal is false
  });

  it('should set the signal to false on unsubscribe', () => {
    // TODO: use a Subject source, subscribe, then unsubscribe before complete
    //       assert signal is false
  });
});
```

**What you'll learn**

`finalize` runs on complete, error, and unsubscribe — it is the correct operator for cleanup that must always happen. Testing all three teardown paths is not optional: in production, requests get cancelled (unsubscribe), time out (error), or complete normally. A signal stuck at `true` is a loading spinner that never stops.

---

### 2c: `retryWithBackoff` (Ch12)

**File:** `challenge-12-rxjs-patterns/src/app/shared/operators/operators.ts`

Different implementation, same concept. Tests should mirror 2a — verify configurable `maxRetries`, `onRetry` callback firing, error propagation after exhaustion.

```ts
describe('retryWithBackoff', () => {
  it('should retry up to the configured maxRetries', fakeAsync(() => {
    // TODO
  }));

  it('should call onRetry with the current attempt number', fakeAsync(() => {
    // TODO
  }));

  it('should propagate the error after maxRetries exhausted', fakeAsync(() => {
    // TODO
  }));
});
```

---

### 2d: `withLoading` (Ch12)

**File:** `challenge-12-rxjs-patterns/src/app/shared/operators/operators.ts`

```ts
describe('withLoading', () => {
  it('should set the signal to true on subscribe', () => {
    // TODO
  });

  it('should set the signal to false on complete', () => {
    // TODO
  });

  it('should set the signal to false on error', () => {
    // TODO
  });

  it('should set the signal to false on unsubscribe', () => {
    // TODO
  });
});
```

---

## Part 3: HTTP Interceptor — `errorInterceptor`

**File:** `challenge-11-centralized-error-handling/src/app/interceptors/error-interceptor.ts`

### Why this is the hardest part

The interceptor composes three things: `retryOnNetworkError`, `catchError`, and two services (`ErrorLogger`, `ToastService`). Testing it means wiring a real HTTP pipeline with `HttpTestingController`, controlling which errors the mock backend returns, and asserting on side effects (toast added, logger called).

`HttpTestingController` lets you flush specific responses to specific requests without a real server — and `httpMock.verify()` in `afterEach` catches requests that were made but never flushed (test isolation).

### Scaffold

```ts
// error-interceptor.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error-interceptor';
import { mockBackendInterceptor } from './mock-backend-interceptor';
import { ToastService } from '../services/toast-service';
import { ErrorLogger } from '../services/error-logger';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let loggerSpy: jasmine.SpyObj<ErrorLogger>;

  beforeEach(() => {
    loggerSpy = jasmine.createSpyObj('ErrorLogger', ['logError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ErrorLogger, useValue: loggerSpy },
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  it('should add an error toast on 404', () => {
    // TODO: make a GET request, flush a 404 response via httpMock,
    //       assert toastService.toasts() contains an error toast
  });

  it('should NOT retry on 404', () => {
    // TODO: flush one 404, verify no second request is pending (httpMock.expectNone)
  });

  it('should retry up to 4 times on 500', fakeAsync(() => {
    // TODO: flush 500 errors for each retry attempt, tick delays,
    //       assert 5 total requests made (1 original + 4 retries)
  }));

  it('should call ErrorLogger.logError with correct context', () => {
    // TODO: flush a 404, assert loggerSpy.logError called with
    //       { source: 'HttpErrorInterceptor', status: 404, method: 'GET' }
  });

  it('should re-throw the error to the subscriber after catching', () => {
    // TODO: subscribe with an error handler, flush a 404,
    //       assert the subscriber received the HttpErrorResponse
  });
});
```

### What you'll learn

`provideHttpClientTesting()` replaces the actual HTTP transport with a mock. `httpMock.expectOne(url)` asserts a request was made and returns a handle to flush a response. `httpMock.verify()` in `afterEach` fails the test if any request was made but not asserted — this catches "invisible" side-effect requests. The interceptor is tested at the HTTP layer, not mocked away — this is the only way to catch bugs in the interceptor's own logic.

---

## Part 4: Structural Directive — `appPermission`

**File:** `challenge-08-custom-directives/src/app/directives/permission.ts`

### The host component pattern

Directives cannot be tested in isolation — they need a host component that provides a template. Create a minimal `@Component` inside the spec file (not exported, only for testing) and configure TestBed with it.

### Setup scaffold

```ts
// permission.spec.ts
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Permission } from './permission';
import { AuthService } from '../services/auth.service';

@Component({
  imports: [Permission],
  template: `<button *appPermission="'admin'">Delete</button>`
})
class HostComponent {}

describe('appPermission', () => {
  let fixture: ComponentFixture<HostComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['hasPermission']);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: authService }]
    });

    fixture = TestBed.createComponent(HostComponent);
  });

  it('should render the button when hasPermission returns true', () => {
    authService.hasPermission.and.returnValue(true);
    fixture.detectChanges();
    // TODO: assert button is present in the DOM
  });

  it('should not render the button when hasPermission returns false', () => {
    authService.hasPermission.and.returnValue(false);
    fixture.detectChanges();
    // TODO: assert button is absent from the DOM
  });

  it('should remove the button when permission is revoked', () => {
    // TODO: start with hasPermission = true, detectChanges, assert present
    //       change to hasPermission = false, trigger change detection
    //       assert button is absent
  });
});
```

### What you'll learn

`fixture.detectChanges()` triggers Angular's change detection and causes the directive's `effect()` to run. DOM assertions use `fixture.nativeElement.querySelector('button')` — `null` means not rendered, an element means it is. The host component pattern is how every structural directive test is written in production — it's the same technique Angular Material uses to test its own directives.

---

## Acceptance Criteria

- [ ] All tests run against real Ch11/Ch12/Ch08 code — zero toy components
- [ ] No `@Input()`, `@Output()`, `*ngIf`, `*ngFor`, `CommonModule`, constructor injection in spec files
- [ ] `provideHttpClientTesting()` used — not `HttpClientTestingModule`
- [ ] `retryOnNetworkError` covers: retry on 503/500/0, no retry on 4xx, `onRetry` callback, exponential delay, error after exhaustion
- [ ] `trackRequest` covers all four finalize paths: complete, error, unsubscribe, and the true-on-subscribe case
- [ ] `withLoading` covers same four paths as `trackRequest`
- [ ] `errorInterceptor` uses `HttpTestingController` with `httpMock.verify()` in `afterEach`
- [ ] `ToastService` handles the dummyMessages pre-load in `beforeEach`
- [ ] `appPermission` uses host component wrapper — no direct directive instantiation
- [ ] All tests pass `ng test` without modifying any source file

---

## Pattern Quick Reference

| Target | Testing Pattern | Key API |
|---|---|---|
| `ToastService` | Signal service | `TestBed.inject`, `fakeAsync` + `tick`, `signal()` reads |
| `retryOnNetworkError` | RxJS operator | `defer` factory count, `fakeAsync`, `HttpErrorResponse` |
| `trackRequest` | RxJS operator | `defer` + `finalize`, signal lifecycle, all teardown paths |
| `retryWithBackoff` | RxJS operator | Configurable retry, callback assertion |
| `withLoading` | RxJS operator | Signal true/false lifecycle |
| `errorInterceptor` | HTTP interceptor | `provideHttpClientTesting`, `HttpTestingController`, `verify()` |
| `appPermission` | Structural directive | Host `@Component`, DOM query, `detectChanges()` |

---

## Resources

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Testing HTTP Requests — HttpTestingController](https://angular.dev/guide/http/testing)
- [fakeAsync / tick](https://angular.dev/guide/testing/components-scenarios#fake-async)
- [Component Testing Scenarios](https://angular.dev/guide/testing/components-scenarios)
- [RxJS TestScheduler — marble testing](https://rxjs.dev/guide/testing/marble-testing)
