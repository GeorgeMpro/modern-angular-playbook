# Challenge #11: Centralized Error Handling - Production Patterns

**Difficulty:** Medium
**Time Estimate:** 3-4 hours
**Focus:** Global error handling, interceptors, toast notifications, logging

---

## Learning Objectives

- Implement GlobalErrorHandler for uncaught errors
- Build HTTP error interceptor for API errors
- Create toast notification service for user feedback
- Build error logging service (console + optional remote)
- Handle different error types (400, 401, 403, 404, 500, network)
- Implement selective error handling (skip mechanism)
- Set up mock backend to simulate errors

---

## The Challenge

Build a **complete centralized error handling system** with these features:

### 1. GlobalErrorHandler
- Catch all uncaught JavaScript errors
- Log errors to console and/or remote service
- Show user-friendly toast notification
- Don't crash the app

### 2. HTTP Error Interceptor
- Intercept all HTTP errors
- Map status codes to user-friendly messages
- Handle network errors (status 0)
- Retry mechanism for transient failures
- Skip mechanism for manual error handling

### 3. Toast Notification Service
- Show error, warning, success, info toasts
- Auto-dismiss after configurable duration
- Stack multiple toasts
- Dismissible by user

### 4. Error Logging Service
- Log to console in development
- Optionally send to remote service (Sentry-style)
- Include error context (URL, user, timestamp)

### 5. Mock Backend
- Simulate various HTTP errors
- Configurable delay and failure rates
- Test all error scenarios

---

## Project Setup

```bash
ng new error-handling-challenge --style=scss --routing=true --ssr=false
cd error-handling-challenge
```

---

## Implementation Guide

### 1. Toast Notification Service

```typescript
// services/toast.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  readonly activeToasts = computed(() => this.toasts());

  show(message: string, type: ToastType = 'info', duration: number = 5000): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type, duration };

    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration ?? 7000);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toasts.set([]);
  }
}
```

---

### 2. Toast Component

```typescript
// components/toast-container/toast-container.component.ts
import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.type }}"
          (click)="toastService.dismiss(toast.id)"
          role="alert"
          aria-live="polite">
          <span class="toast__icon">{{ getIcon(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toast--success { background: #10b981; }
    .toast--error { background: #ef4444; }
    .toast--warning { background: #f59e0b; }
    .toast--info { background: #3b82f6; }

    .toast__icon { font-size: 1.25rem; }
    .toast__message { flex: 1; }
    .toast__close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.7;
      &:hover { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastContainerComponent {
  protected toastService = inject(ToastService);

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] ?? 'ℹ';
  }
}
```

---

### 3. Error Logging Service

```typescript
// services/error-logger.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ErrorLog {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  context?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ErrorLoggerService {
  private http = inject(HttpClient);
  private readonly remoteLoggingEnabled = false; // Toggle for production
  private readonly remoteLoggingUrl = '/api/logs/errors';

  log(error: Error, context?: Record<string, unknown>): void {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      context
    };

    // Always log to console in development
    this.logToConsole(errorLog);

    // Optionally send to remote service
    if (this.remoteLoggingEnabled) {
      this.logToRemote(errorLog);
    }
  }

  private logToConsole(errorLog: ErrorLog): void {
    console.group('🔴 Error Logged');
    console.error('Message:', errorLog.message);
    console.error('URL:', errorLog.url);
    console.error('Timestamp:', errorLog.timestamp);
    if (errorLog.stack) {
      console.error('Stack:', errorLog.stack);
    }
    if (errorLog.context) {
      console.error('Context:', errorLog.context);
    }
    console.groupEnd();
  }

  private logToRemote(errorLog: ErrorLog): void {
    // Fire and forget - don't let logging errors cause more errors
    this.http.post(this.remoteLoggingUrl, errorLog, {
      headers: { 'X-Skip-Error-Handler': 'true' }
    }).subscribe({
      error: () => console.warn('Failed to send error log to remote service')
    });
  }
}
```

---

### 4. GlobalErrorHandler

```typescript
// handlers/global-error.handler.ts
import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { ErrorLoggerService } from '../services/error-logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toastService = inject(ToastService);
  private errorLogger = inject(ErrorLoggerService);
  private ngZone = inject(NgZone);

  handleError(error: Error): void {
    // Log the error
    this.errorLogger.log(error, { source: 'GlobalErrorHandler' });

    // Show user-friendly toast (run inside Angular zone)
    this.ngZone.run(() => {
      this.toastService.error(
        'An unexpected error occurred. Please try again.',
        7000
      );
    });

    // Re-throw in development for debugging
    // In production, you might want to suppress this
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      console.error('GlobalErrorHandler caught:', error);
    }
  }
}
```

---

### 5. HTTP Error Messages Mapping

```typescript
// utils/http-error-messages.ts
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  0: 'Network error. Please check your internet connection.',
  400: 'Invalid request. Please check your input.',
  401: 'Session expired. Please log in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timeout. Please try again.',
  409: 'Conflict with current state. Please refresh and try again.',
  422: 'Validation error. Please check your input.',
  429: 'Too many requests. Please wait and try again.',
  500: 'Server error. Please try again later.',
  502: 'Server is temporarily unavailable. Please try again.',
  503: 'Service unavailable. Please try again later.',
  504: 'Server timeout. Please try again.'
};

export function getHttpErrorMessage(status: number, fallback?: string): string {
  return HTTP_ERROR_MESSAGES[status] ?? fallback ?? `Error ${status}: Something went wrong.`;
}
```

---

### 6. HTTP Error Interceptor

```typescript
// interceptors/http-error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { ErrorLoggerService } from '../services/error-logger.service';
import { getHttpErrorMessage } from '../utils/http-error-messages';

// Context token to skip error handling for specific requests
export const SKIP_ERROR_HANDLER = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const errorLogger = inject(ErrorLoggerService);

  // Check if error handling should be skipped
  const skipErrorHandler = req.context.get(SKIP_ERROR_HANDLER);

  return next(req).pipe(
    // Retry network errors (status 0) up to 2 times
    retry({
      count: 2,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse && error.status === 0) {
          console.log(`Retrying request (attempt ${retryCount})...`);
          return timer(1000 * retryCount); // Exponential backoff
        }
        return throwError(() => error);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Log all HTTP errors
      errorLogger.log(
        new Error(`HTTP Error: ${error.status} - ${error.url}`),
        {
          source: 'HttpErrorInterceptor',
          status: error.status,
          url: error.url,
          method: req.method,
          body: error.error
        }
      );

      // Skip toast if requested
      if (skipErrorHandler) {
        return throwError(() => error);
      }

      // Handle specific status codes
      switch (error.status) {
        case 401:
          // Could trigger logout here
          toastService.error(getHttpErrorMessage(401));
          // authService.logout();
          break;

        case 403:
          toastService.error(getHttpErrorMessage(403));
          break;

        case 404:
          toastService.warning(getHttpErrorMessage(404));
          break;

        case 0:
          // Network error (after retries failed)
          toastService.error(getHttpErrorMessage(0));
          break;

        default:
          toastService.error(getHttpErrorMessage(error.status));
      }

      return throwError(() => error);
    })
  );
};
```

---

### 7. Mock Backend Interceptor

```typescript
// interceptors/mock-backend.interceptor.ts
import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';

interface MockConfig {
  path: string;
  method: string;
  response?: unknown;
  status?: number;
  delay?: number;
}

const MOCK_RESPONSES: MockConfig[] = [
  // Success responses
  {
    path: '/api/users',
    method: 'GET',
    response: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    delay: 500
  },
  {
    path: '/api/users/1',
    method: 'GET',
    response: { id: 1, name: 'John Doe', email: 'john@example.com' },
    delay: 300
  },

  // Error responses for testing
  {
    path: '/api/error/400',
    method: 'GET',
    status: 400,
    response: { message: 'Bad request - invalid parameters' },
    delay: 200
  },
  {
    path: '/api/error/401',
    method: 'GET',
    status: 401,
    response: { message: 'Unauthorized - token expired' },
    delay: 200
  },
  {
    path: '/api/error/403',
    method: 'GET',
    status: 403,
    response: { message: 'Forbidden - insufficient permissions' },
    delay: 200
  },
  {
    path: '/api/error/404',
    method: 'GET',
    status: 404,
    response: { message: 'Resource not found' },
    delay: 200
  },
  {
    path: '/api/error/500',
    method: 'GET',
    status: 500,
    response: { message: 'Internal server error' },
    delay: 200
  },
  {
    path: '/api/error/network',
    method: 'GET',
    status: 0, // Network error
    delay: 200
  },
  {
    path: '/api/error/timeout',
    method: 'GET',
    status: 408,
    response: { message: 'Request timeout' },
    delay: 5000
  }
];

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept /api requests
  if (!req.url.includes('/api')) {
    return next(req);
  }

  const mockConfig = MOCK_RESPONSES.find(
    mock => req.url.endsWith(mock.path) && req.method === mock.method
  );

  if (!mockConfig) {
    // No mock found, return 404
    return throwError(() => new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      url: req.url,
      error: { message: `No mock found for ${req.method} ${req.url}` }
    })).pipe(delay(100));
  }

  const responseDelay = mockConfig.delay ?? 300;

  // Return error response
  if (mockConfig.status && mockConfig.status >= 400) {
    return throwError(() => new HttpErrorResponse({
      status: mockConfig.status!,
      statusText: getStatusText(mockConfig.status!),
      url: req.url,
      error: mockConfig.response
    })).pipe(delay(responseDelay));
  }

  // Return success response
  return of(new HttpResponse({
    status: 200,
    body: mockConfig.response
  })).pipe(delay(responseDelay));
};

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    0: 'Network Error',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    408: 'Request Timeout',
    500: 'Internal Server Error'
  };
  return statusTexts[status] ?? 'Error';
}
```

---

### 8. App Configuration

```typescript
// app.config.ts
import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './handlers/global-error.handler';
import { httpErrorInterceptor } from './interceptors/http-error.interceptor';
import { mockBackendInterceptor } from './interceptors/mock-backend.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        mockBackendInterceptor,  // First - mock the backend
        httpErrorInterceptor     // Then - handle errors
      ])
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
```

---

### 9. App Component with Toast Container

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <app-toast-container />
    <router-outlet />
  `
})
export class AppComponent {}
```

---

### 10. Test Page Component

```typescript
// pages/error-test/error-test.component.ts
import { Component, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { SKIP_ERROR_HANDLER } from '../../interceptors/http-error.interceptor';

@Component({
  selector: 'app-error-test',
  standalone: true,
  template: `
    <div class="container">
      <h1>Error Handling Test Page</h1>

      <section>
        <h2>Success Requests</h2>
        <button (click)="fetchUsers()">GET /api/users (Success)</button>
        <button (click)="fetchUser()">GET /api/users/1 (Success)</button>
      </section>

      <section>
        <h2>HTTP Errors</h2>
        <button (click)="trigger400()">400 Bad Request</button>
        <button (click)="trigger401()">401 Unauthorized</button>
        <button (click)="trigger403()">403 Forbidden</button>
        <button (click)="trigger404()">404 Not Found</button>
        <button (click)="trigger500()">500 Server Error</button>
        <button (click)="triggerNetwork()">Network Error</button>
      </section>

      <section>
        <h2>JavaScript Errors</h2>
        <button (click)="triggerJsError()">Throw JS Error</button>
        <button (click)="triggerAsyncError()">Throw Async Error</button>
        <button (click)="triggerTypeError()">Throw TypeError</button>
      </section>

      <section>
        <h2>Manual Error Handling</h2>
        <button (click)="triggerSkippedError()">404 with Skip (Manual Handle)</button>
      </section>

      <section>
        <h2>Toast Tests</h2>
        <button (click)="showSuccess()">Success Toast</button>
        <button (click)="showWarning()">Warning Toast</button>
        <button (click)="showInfo()">Info Toast</button>
        <button (click)="showMultiple()">Multiple Toasts</button>
      </section>

      @if (lastResponse()) {
        <section>
          <h2>Last Response</h2>
          <pre>{{ lastResponse() | json }}</pre>
        </section>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
    }
    section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    h2 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    button {
      margin: 0.25rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      &:hover { background: #2563eb; }
    }
    pre {
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 4px;
      overflow: auto;
    }
  `],
  imports: [JsonPipe]
})
export class ErrorTestComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  lastResponse = signal<unknown>(null);

  // Success requests
  fetchUsers(): void {
    this.http.get('/api/users').subscribe({
      next: data => {
        this.lastResponse.set(data);
        this.toast.success('Users loaded successfully!');
      }
    });
  }

  fetchUser(): void {
    this.http.get('/api/users/1').subscribe({
      next: data => {
        this.lastResponse.set(data);
        this.toast.success('User loaded!');
      }
    });
  }

  // HTTP errors
  trigger400(): void {
    this.http.get('/api/error/400').subscribe();
  }

  trigger401(): void {
    this.http.get('/api/error/401').subscribe();
  }

  trigger403(): void {
    this.http.get('/api/error/403').subscribe();
  }

  trigger404(): void {
    this.http.get('/api/error/404').subscribe();
  }

  trigger500(): void {
    this.http.get('/api/error/500').subscribe();
  }

  triggerNetwork(): void {
    this.http.get('/api/error/network').subscribe();
  }

  // JavaScript errors
  triggerJsError(): void {
    throw new Error('This is a test JavaScript error!');
  }

  triggerAsyncError(): void {
    setTimeout(() => {
      throw new Error('This is an async error!');
    }, 100);
  }

  triggerTypeError(): void {
    const obj: any = null;
    obj.property; // TypeError: Cannot read property of null
  }

  // Skipped error handling
  triggerSkippedError(): void {
    this.http.get('/api/error/404', {
      context: new HttpContext().set(SKIP_ERROR_HANDLER, true)
    }).subscribe({
      error: (err) => {
        // Handle manually
        this.toast.warning('Manually handled: Resource not found, showing fallback.');
        this.lastResponse.set({ fallback: 'No data available' });
      }
    });
  }

  // Toast tests
  showSuccess(): void {
    this.toast.success('Operation completed successfully!');
  }

  showWarning(): void {
    this.toast.warning('Please review your input.');
  }

  showInfo(): void {
    this.toast.info('Tip: You can dismiss toasts by clicking them.');
  }

  showMultiple(): void {
    this.toast.success('First toast');
    setTimeout(() => this.toast.info('Second toast'), 200);
    setTimeout(() => this.toast.warning('Third toast'), 400);
    setTimeout(() => this.toast.error('Fourth toast'), 600);
  }
}

import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
```

---

### 11. Routes

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'error-test',
    pathMatch: 'full'
  },
  {
    path: 'error-test',
    loadComponent: () => import('./pages/error-test/error-test.component')
      .then(m => m.ErrorTestComponent)
  }
];
```

---

## Acceptance Criteria

### Toast Service
- [ ] Shows success, error, warning, info toasts
- [ ] Auto-dismisses after duration
- [ ] Dismissible by clicking
- [ ] Stacks multiple toasts
- [ ] Smooth animations

### GlobalErrorHandler
- [ ] Catches uncaught JavaScript errors
- [ ] Logs errors with context
- [ ] Shows user-friendly toast
- [ ] Doesn't crash the app

### HTTP Error Interceptor
- [ ] Intercepts all HTTP errors
- [ ] Maps status codes to messages
- [ ] Retries network errors (status 0)
- [ ] Skip mechanism works with HttpContext
- [ ] Logs all errors

### Mock Backend
- [ ] Returns success responses
- [ ] Simulates various HTTP errors (400-500)
- [ ] Simulates network errors
- [ ] Configurable delay

### Error Logging
- [ ] Logs to console with formatted output
- [ ] Includes error context (URL, timestamp, stack)
- [ ] Optional remote logging structure ready

---

## Testing Strategy

```typescript
describe('ToastService', () => {
  it('should add toast to activeToasts', () => {
    service.success('Test message');
    expect(service.activeToasts().length).toBe(1);
    expect(service.activeToasts()[0].type).toBe('success');
  });

  it('should auto-dismiss after duration', fakeAsync(() => {
    service.show('Test', 'info', 1000);
    expect(service.activeToasts().length).toBe(1);
    tick(1000);
    expect(service.activeToasts().length).toBe(0);
  }));

  it('should dismiss specific toast by id', () => {
    service.success('Toast 1');
    service.error('Toast 2');
    const id = service.activeToasts()[0].id;
    service.dismiss(id);
    expect(service.activeToasts().length).toBe(1);
  });
});

describe('HttpErrorInterceptor', () => {
  it('should show toast for 500 error', () => {
    // Trigger 500 error
    // Verify toast.error was called
  });

  it('should skip toast when SKIP_ERROR_HANDLER is true', () => {
    // Make request with skip context
    // Verify toast was NOT called
    // Verify error was still thrown
  });

  it('should retry network errors', () => {
    // Trigger network error
    // Verify retry attempts
  });
});

describe('GlobalErrorHandler', () => {
  it('should log errors', () => {
    const error = new Error('Test error');
    handler.handleError(error);
    // Verify errorLogger.log was called
  });

  it('should show toast for errors', () => {
    const error = new Error('Test error');
    handler.handleError(error);
    // Verify toast.error was called
  });
});
```

---

## HARD Mode: Advanced Features

Complete the basics above first, then add these production-ready features.

### 1. Exponential Backoff Retry with Jitter

```typescript
// interceptors/retry.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer, throwError } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const maxRetries = 4;
  const baseDelay = 1000;

  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error: HttpErrorResponse, retryCount) => {
        // Don't retry client errors (4xx) except timeout/rate-limit
        if (error.status >= 400 && error.status < 500 &&
            error.status !== 408 && error.status !== 429) {
          return throwError(() => error);
        }

        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, retryCount - 1);

        // Add jitter (±25%) to avoid thundering herd
        const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
        const finalDelay = Math.round(delay + jitter);

        console.log(`🔄 Retry ${retryCount}/${maxRetries} in ${finalDelay}ms`);
        return timer(finalDelay);
      }
    })
  );
};
```

---

### 2. Offline Detection & Request Queue

```typescript
// services/network.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  isOnline = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => {
      console.log('✅ Back online');
      this.isOnline.set(true);
    });
    window.addEventListener('offline', () => {
      console.log('❌ Went offline');
      this.isOnline.set(false);
    });
  }
}
```

```typescript
// services/offline-queue.service.ts
import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NetworkService } from './network.service';
import { ToastService } from './toast.service';

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  body: unknown;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private http = inject(HttpClient);
  private network = inject(NetworkService);
  private toast = inject(ToastService);

  private readonly STORAGE_KEY = 'offline_queue';
  queue = signal<QueuedRequest[]>(this.loadQueue());

  constructor() {
    effect(() => {
      if (this.network.isOnline() && this.queue().length > 0) {
        this.toast.info('Back online. Syncing queued requests...');
        this.processQueue();
      }
    });
  }

  addToQueue(method: string, url: string, body: unknown): void {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return;

    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      method,
      url,
      body,
      timestamp: Date.now()
    };

    this.queue.update(q => [...q, request]);
    this.saveQueue();
    this.toast.warning('Request queued. Will sync when online.');
  }

  private processQueue(): void {
    this.queue().forEach(req => {
      this.http.request(req.method, req.url, { body: req.body }).subscribe({
        next: () => {
          this.removeFromQueue(req.id);
          this.toast.success('Queued request completed');
        },
        error: () => console.error('Queued request failed:', req.url)
      });
    });
  }

  private removeFromQueue(id: string): void {
    this.queue.update(q => q.filter(r => r.id !== id));
    this.saveQueue();
  }

  private saveQueue(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue()));
  }

  private loadQueue(): QueuedRequest[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}
```

```typescript
// components/offline-banner.component.ts
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: `
    @if (!network.isOnline()) {
      <div class="offline-banner">
        <span>🔌 You are offline</span>
        @if (queue.queue().length > 0) {
          <span class="queue-badge">{{ queue.queue().length }} queued</span>
        }
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: #f59e0b;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 10000;
      display: flex;
      justify-content: center;
      gap: 16px;
    }
    .queue-badge {
      background: rgba(255,255,255,0.3);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
    }
  `]
})
export class OfflineBannerComponent {
  network = inject(NetworkService);
  queue = inject(OfflineQueueService);
}
```

---

### 3. Request Caching

```typescript
// services/request-cache.service.ts
@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private cache = new Map<string, { response: unknown; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(url: string): unknown | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(url);
      return null;
    }

    console.log('✅ Cache HIT:', url);
    return entry.response;
  }

  set(url: string, response: unknown): void {
    this.cache.set(url, { response, timestamp: Date.now() });
    console.log('💾 Cached:', url);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

### 4. Router Error Handling

```typescript
// app.config.ts
import { provideRouter, withNavigationErrorHandler } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withNavigationErrorHandler((error) => {
        console.error('Navigation error:', error);

        // Handle lazy loading failures
        if (error.message?.includes('ChunkLoadError')) {
          alert('Failed to load page. Refreshing...');
          window.location.reload();
        }
      })
    ),
    // ... other providers
  ]
};

// app.routes.ts - Add error pages
export const routes: Routes = [
  // ... your routes
  { path: '404', loadComponent: () => import('./pages/not-found.component') },
  { path: '403', loadComponent: () => import('./pages/forbidden.component') },
  { path: '**', redirectTo: '/404' }
];
```

---

### 5. Error Rate Limiting

```typescript
// services/toast.service.ts - Add rate limiting
@Injectable({ providedIn: 'root' })
export class ToastService {
  private recentMessages = new Map<string, number>();
  private readonly RATE_LIMIT_MS = 5000;

  error(message: string, duration?: number): void {
    if (this.isRateLimited(message)) {
      console.log('Toast rate-limited:', message);
      return;
    }
    this.show(message, 'error', duration ?? 7000);
  }

  private isRateLimited(message: string): boolean {
    const lastShown = this.recentMessages.get(message);
    const now = Date.now();

    if (lastShown && now - lastShown < this.RATE_LIMIT_MS) {
      return true;
    }

    this.recentMessages.set(message, now);
    return false;
  }
}
```

---

## Hard Mode Acceptance Criteria

- [ ] Exponential backoff with jitter implemented
- [ ] Offline detection shows banner
- [ ] Write requests queued when offline
- [ ] Queue persists to localStorage
- [ ] Auto-retry when back online
- [ ] GET requests cached with TTL
- [ ] Router errors handled gracefully
- [ ] Lazy load failures trigger refresh
- [ ] Custom 404 page works
- [ ] Toast rate limiting prevents spam

---

## Interview Tips

**Why Interviewers Care:**
- Error handling shows production readiness
- Retry logic shows understanding of resilience
- Offline support shows mobile-first thinking
- Proper error display shows UX awareness

**Common Questions:**
1. "How would you handle errors in Angular?" → Global ErrorHandler + HTTP interceptors
2. "When would you retry a request?" → Network errors, NOT client errors (4xx)
3. "How do you show errors to users?" → Toast notifications, error components
4. "What's exponential backoff?" → Increasing delay between retries (1s, 2s, 4s...)
5. "How do you handle offline mode?" → Queue requests, retry when back online

**Mistakes to Avoid:**
- ❌ Silent failures (no user feedback)
- ❌ Retrying 4xx errors (client errors shouldn't retry)
- ❌ No loading states (user doesn't know what's happening)
- ❌ Generic "Error occurred" messages (not helpful)
- ❌ Memory leaks (unsubscribed retries)

---

## Resources

- [Angular Error Handling Best Practices](https://angular.dev/best-practices/error-handling)
- [Angular HTTP Interceptors](https://angular.dev/guide/http/interceptors)
- [Advanced Error Handling Patterns](https://dev.to/codewithrajat/advanced-angular-error-handling-best-practices-architecture-tips-code-examples-3939)
- [TrackJS Angular Error Handling Guide](https://trackjs.com/blog/angular-error-handling/)
- [Global Error Handling in Angular](https://pkief.medium.com/global-error-handling-in-angular-ea395ce174b1)

---

## Production Tips

1. **Don't expose stack traces to users** - Log them, but show friendly messages
2. **Categorize errors** - Some need user action, some are informational
3. **Implement error recovery** - Retry transient failures automatically
4. **Monitor error rates** - Sudden spikes indicate problems
5. **Test your error handlers** - They're code too!
6. **Have fallback UI** - Empty states, retry buttons
7. **Consider error boundaries** - Isolate failures to components
8. **Rate limit error logging** - Don't spam your log service

---

**This is production-ready error handling. Build it, test it, understand it!**
