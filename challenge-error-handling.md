# Challenge: Error Handling - Comprehensive Error Management

**Difficulty:** Medium → Hard
**Time Estimate:** 3-4 hours
**Focus:** Global error handling, HTTP interceptors, retry strategies, offline support

---

## 🎯 Learning Objectives

- Implement Global ErrorHandler for runtime errors
- Build HTTP error interceptors with retry logic
- Handle async errors (Observables, Promises)
- Implement exponential backoff retry strategies
- Detect and handle offline/online state
- Queue failed requests for retry
- Create user-friendly error displays
- Implement error boundaries
- Add error logging/analytics
- Handle form validation errors globally
- Router error handling

---

## 📋 Challenge Structure

This challenge has **TWO levels** - complete Medium first, then advance to Hard.

---

## 🎯 MEDIUM: Foundation Error Handling

Build a basic but complete error handling system.

### Requirements

**1. Global Error Handler**
- Custom ErrorHandler class
- Catch all unhandled runtime errors
- Log errors to console with context
- Display user-friendly error message (toast/alert)
- Differentiate: client errors vs server errors

**2. HTTP Error Interceptor**
- Intercept all HTTP responses
- Handle common status codes:
  - 400: Bad Request → Show validation errors
  - 401: Unauthorized → Redirect to login
  - 403: Forbidden → Show "Access Denied"
  - 404: Not Found → Show "Resource not found"
  - 500: Server Error → Show "Something went wrong"
  - 0: Network Error → Show "Check your connection"
- Extract and display API error messages
- Transform errors into user-friendly format

**3. Retry Logic (Basic)**
- Retry failed requests automatically
- Retry network errors (status 0) only
- Max 3 retry attempts
- 1 second delay between retries
- Don't retry 4xx errors (client errors)

**4. Loading State Management**
- Global loading spinner during HTTP requests
- Track concurrent requests
- Show/hide spinner appropriately
- Skip loading for background requests

**5. User Feedback**
- Toast notification service
- Show success/error/warning/info messages
- Auto-dismiss after 5 seconds
- Close button for manual dismiss
- Queue multiple toasts

**6. Error Display Component**
- Reusable error display component
- Props: errorMessage, retryCallback
- Show icon + message + retry button
- Empty state when no error

---

## 🎯 HARD: Advanced Error Handling

Extend the Medium challenge with production-ready features.

### Additional Requirements

**1. Exponential Backoff Retry**
- Replace basic retry with exponential backoff
- Delay increases: 1s → 2s → 4s → 8s
- Configurable max retries per request
- Jitter to avoid thundering herd
- Cancel retries on component destroy

**2. Offline Detection & Queue**
- Detect online/offline state with signals
- Show offline banner when disconnected
- Queue write operations (POST/PUT/DELETE) when offline
- Auto-retry queued requests when back online
- Persist queue to localStorage
- Show queue status to user

**3. Request Deduplication**
- Prevent duplicate simultaneous requests
- Cache identical GET requests
- Cancel previous in-flight requests when new one starts
- Configurable cache duration

**4. Error Recovery Strategies**
- Fallback data when requests fail
- Graceful degradation (show cached data)
- Partial failure handling (some requests succeed, some fail)
- Retry only failed requests in a batch

**5. Advanced Error Logging**
- Log errors to external service (mock analytics)
- Include context: user ID, timestamp, URL, browser
- Stack trace capture
- Error frequency tracking
- Environment-aware logging (dev vs prod)

**6. Router Error Handling**
- Handle navigation errors
- Catch lazy-loading failures
- Retry failed lazy module loads
- Custom error pages (404, 500, 403)
- Preserve URL on error

**7. Form Error Handling**
- Global form error display pattern
- Async validation errors
- Server-side validation errors
- Field-level + form-level errors
- Scroll to first error

**8. Error Boundaries (Component-Level)**
- Wrap components with error boundaries
- Catch errors in component tree
- Show fallback UI on error
- Prevent entire app crash
- Log boundary errors separately

---

## 🏗️ Mock API Setup

Create a mock API with endpoints that produce errors for testing.

### Mock Backend Service

```typescript
// services/mock-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class MockApiService {
  private products: Product[] = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 25 },
    { id: 3, name: 'Keyboard', price: 75 }
  ];

  constructor(private http: HttpClient) {}

  // ✅ SUCCESS: Returns data
  getProducts(): Observable<Product[]> {
    return of(this.products).pipe(delay(500));
  }

  // ❌ 404: Not Found
  getProduct404(id: number): Observable<Product> {
    return throwError(() => ({
      status: 404,
      statusText: 'Not Found',
      error: { message: `Product ${id} not found` }
    } as HttpErrorResponse));
  }

  // ❌ 500: Server Error
  getProductsServerError(): Observable<Product[]> {
    return throwError(() => ({
      status: 500,
      statusText: 'Internal Server Error',
      error: { message: 'Database connection failed' }
    } as HttpErrorResponse));
  }

  // ❌ 400: Bad Request (Validation Error)
  createProductBadRequest(product: Partial<Product>): Observable<Product> {
    return throwError(() => ({
      status: 400,
      statusText: 'Bad Request',
      error: {
        message: 'Validation failed',
        errors: {
          name: 'Name is required',
          price: 'Price must be positive'
        }
      }
    } as HttpErrorResponse));
  }

  // ❌ 401: Unauthorized
  getProtectedResource(): Observable<any> {
    return throwError(() => ({
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Please log in to access this resource' }
    } as HttpErrorResponse));
  }

  // ❌ 403: Forbidden
  deleteProductForbidden(id: number): Observable<void> {
    return throwError(() => ({
      status: 403,
      statusText: 'Forbidden',
      error: { message: 'You do not have permission to delete products' }
    } as HttpErrorResponse));
  }

  // ❌ 0: Network Error
  getProductsNetworkError(): Observable<Product[]> {
    return throwError(() => ({
      status: 0,
      statusText: 'Unknown Error',
      error: { message: 'Network connection failed' }
    } as HttpErrorResponse));
  }

  // 🔀 FLAKY: Randomly succeeds or fails (for retry testing)
  getFlakyProducts(): Observable<Product[]> {
    const shouldFail = Math.random() > 0.5;

    return of(shouldFail).pipe(
      delay(300),
      mergeMap(fail => {
        if (fail) {
          return throwError(() => ({
            status: 0,
            statusText: 'Network Error',
            error: { message: 'Connection timeout' }
          } as HttpErrorResponse));
        }
        return of(this.products);
      })
    );
  }

  // ⏱️ SLOW: Takes 5 seconds (for timeout testing)
  getProductsSlow(): Observable<Product[]> {
    return of(this.products).pipe(delay(5000));
  }
}
```

---

## 🏗️ Implementation Guide - MEDIUM

### 1. Global Error Handler

```typescript
// services/global-error-handler.service.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toastService = inject(ToastService);

  handleError(error: Error | HttpErrorResponse): void {
    console.error('❌ Global error caught:', error);

    // Determine error type and message
    let errorMessage: string;

    if (error instanceof HttpErrorResponse) {
      // Server error
      errorMessage = this.getServerErrorMessage(error);
      console.error(`Server error: ${error.status}`, error.error);
    } else {
      // Client error
      errorMessage = this.getClientErrorMessage(error);
      console.error('Client error:', error.message, error.stack);
    }

    // Show user-friendly message
    this.toastService.showError(errorMessage);

    // TODO: Log to external service (Sentry, LogRocket, etc.)
    // this.logErrorToAnalytics(error);
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect. Please check your internet connection.';
    }

    if (error.error?.message) {
      return error.error.message;
    }

    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `An error occurred (${error.status}). Please try again.`;
    }
  }

  private getClientErrorMessage(error: Error): string {
    // Production: Don't show stack traces
    if (error.message) {
      return `Application error: ${error.message}`;
    }
    return 'An unexpected error occurred. Please refresh the page.';
  }
}

// Register in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // ... other providers
  ]
};
```

---

### 2. HTTP Error Interceptor

```typescript
// interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    // BASIC RETRY: Only network errors, max 3 attempts, 1s delay
    retry({
      count: 3,
      delay: (error: HttpErrorResponse, retryCount) => {
        // Only retry network errors (status 0)
        if (error.status === 0) {
          console.log(`🔄 Retry attempt ${retryCount} for ${req.url}`);
          return timer(1000); // 1 second delay
        }
        // Don't retry client/server errors
        return throwError(() => error);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      // Handle specific error codes
      switch (error.status) {
        case 0:
          // Network error (after retries failed)
          toast.showError('Network error. Please check your connection.');
          break;

        case 400:
          // Bad Request - show validation errors
          const validationMsg = this.formatValidationErrors(error);
          toast.showError(validationMsg || 'Invalid request');
          break;

        case 401:
          // Unauthorized - redirect to login
          toast.showWarning('Session expired. Please log in again.');
          router.navigate(['/login']);
          break;

        case 403:
          // Forbidden
          toast.showError('Access denied. You do not have permission.');
          break;

        case 404:
          // Not Found
          toast.showError('Resource not found');
          break;

        case 500:
        case 502:
        case 503:
          // Server errors
          toast.showError('Server error. Please try again later.');
          break;

        default:
          // Generic error
          const message = error.error?.message || 'An error occurred';
          toast.showError(message);
      }

      // Re-throw for component-level handling if needed
      return throwError(() => error);
    })
  );
};

// Helper: Format validation errors
function formatValidationErrors(error: HttpErrorResponse): string {
  const errors = error.error?.errors;
  if (!errors) return '';

  // errors: { name: 'Name is required', price: 'Price must be positive' }
  const messages = Object.values(errors).join(', ');
  return `Validation errors: ${messages}`;
}

// Register in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([errorInterceptor])
    )
  ]
};
```

---

### 3. Toast Notification Service

```typescript
// services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  private show(type: Toast['type'], message: string, duration = 5000): void {
    const id = this.nextId++;
    const toast: Toast = { id, type, message, duration };

    // Add to array
    this.toasts.update(current => [...current, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  showSuccess(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  showError(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  showWarning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  showInfo(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
```

**Toast Component:**

```typescript
// components/toast-container.component.ts
import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}">
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)">
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .toast {
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease;
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

    .toast-success {
      background: #10b981;
      color: white;
    }

    .toast-error {
      background: #ef4444;
      color: white;
    }

    .toast-warning {
      background: #f59e0b;
      color: white;
    }

    .toast-info {
      background: #3b82f6;
      color: white;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}

// Add to app.component.ts template:
// <app-toast-container />
```

---

### 4. Loading Service

```typescript
// services/loading.service.ts
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingCount = signal(0);
  isLoading = computed(() => this.loadingCount() > 0);

  startLoading(): void {
    this.loadingCount.update(count => count + 1);
  }

  stopLoading(): void {
    this.loadingCount.update(count => Math.max(0, count - 1));
  }
}
```

**Loading Interceptor:**

```typescript
// interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading for requests with special header
  if (req.headers.has('X-Skip-Loading')) {
    return next(req);
  }

  loadingService.startLoading();

  return next(req).pipe(
    finalize(() => loadingService.stopLoading())
  );
};
```

**Loading Spinner Component:**

```typescript
// components/loading-spinner.component.ts
import { Component, inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <div class="spinner"></div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  loadingService = inject(LoadingService);
}
```

---

### 5. Error Display Component

```typescript
// components/error-display.component.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-display',
  standalone: true,
  template: `
    @if (errorMessage()) {
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <p class="error-message">{{ errorMessage() }}</p>
          @if (showRetry()) {
            <button class="retry-button" (click)="retry.emit()">
              Try Again
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .error-container {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      margin: 16px 0;
    }

    .error-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-message {
      margin: 0 0 12px 0;
      color: #991b1b;
      font-size: 14px;
    }

    .retry-button {
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .retry-button:hover {
      background: #b91c1c;
    }
  `]
})
export class ErrorDisplayComponent {
  errorMessage = input.required<string>();
  showRetry = input<boolean>(true);
  retry = output<void>();
}
```

---

## 🏗️ Implementation Guide - HARD

### 1. Exponential Backoff Retry

```typescript
// interceptors/retry.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { retryWhen, mergeMap, timer, throwError, take } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const maxRetries = 4; // Total: 1 original + 4 retries = 5 attempts
  const baseDelay = 1000; // 1 second

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        mergeMap((error: HttpErrorResponse, retryAttempt) => {
          // Don't retry client errors (4xx except 408/429)
          if (error.status >= 400 && error.status < 500 &&
              error.status !== 408 && error.status !== 429) {
            return throwError(() => error);
          }

          // Don't retry if max retries reached
          if (retryAttempt >= maxRetries) {
            console.error(`❌ Max retries (${maxRetries}) reached for ${req.url}`);
            return throwError(() => error);
          }

          // Exponential backoff: 1s, 2s, 4s, 8s
          const delay = baseDelay * Math.pow(2, retryAttempt);

          // Add jitter (±25%) to avoid thundering herd
          const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
          const finalDelay = delay + jitter;

          console.log(
            `🔄 Retry attempt ${retryAttempt + 1}/${maxRetries} ` +
            `for ${req.url} in ${Math.round(finalDelay)}ms`
          );

          return timer(finalDelay);
        }),
        take(maxRetries)
      )
    )
  );
};
```

---

### 2. Offline Detection & Queue

```typescript
// services/network.service.ts
import { Injectable, signal, effect } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  // Signal-based online/offline state
  isOnline = signal(navigator.onLine);

  constructor() {
    // Listen to online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(online => {
      console.log(online ? '✅ Back online' : '❌ Went offline');
      this.isOnline.set(online);
    });

    // Log state changes
    effect(() => {
      const online = this.isOnline();
      console.log(`Network status: ${online ? 'ONLINE' : 'OFFLINE'}`);
    });
  }
}
```

**Offline Queue Service:**

```typescript
// services/offline-queue.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { NetworkService } from './network.service';
import { ToastService } from './toast.service';

export interface QueuedRequest {
  id: string;
  request: HttpRequest<any>;
  timestamp: number;
  retryCount: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private http = inject(HttpClient);
  private network = inject(NetworkService);
  private toast = inject(ToastService);

  private readonly STORAGE_KEY = 'offline_request_queue';
  queue = signal<QueuedRequest[]>(this.loadQueue());

  constructor() {
    // When back online, process queue
    effect(() => {
      if (this.network.isOnline() && this.queue().length > 0) {
        this.toast.showInfo('Back online. Syncing queued requests...');
        this.processQueue();
      }
    });
  }

  addToQueue(request: HttpRequest<any>): void {
    // Only queue write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return;
    }

    const queuedRequest: QueuedRequest = {
      id: crypto.randomUUID(),
      request,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.update(current => [...current, queuedRequest]);
    this.saveQueue();

    this.toast.showWarning(
      `Request queued. Will retry when back online.`
    );
  }

  private processQueue(): void {
    const requests = this.queue();

    requests.forEach(queued => {
      // Clone and execute request
      this.http.request(queued.request).subscribe({
        next: () => {
          this.removeFromQueue(queued.id);
          this.toast.showSuccess('Queued request completed');
        },
        error: (err) => {
          console.error('Queued request failed:', err);
          this.incrementRetry(queued.id);
        }
      });
    });
  }

  private removeFromQueue(id: string): void {
    this.queue.update(current => current.filter(q => q.id !== id));
    this.saveQueue();
  }

  private incrementRetry(id: string): void {
    this.queue.update(current =>
      current.map(q =>
        q.id === id
          ? { ...q, retryCount: q.retryCount + 1 }
          : q
      )
    );
    this.saveQueue();
  }

  private saveQueue(): void {
    // Serialize requests for localStorage
    const serialized = this.queue().map(q => ({
      id: q.id,
      url: q.request.url,
      method: q.request.method,
      body: q.request.body,
      headers: q.request.headers,
      timestamp: q.timestamp,
      retryCount: q.retryCount
    }));

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
  }

  private loadQueue(): QueuedRequest[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      // Reconstruct HttpRequest objects
      return parsed.map((item: any) => ({
        id: item.id,
        request: new HttpRequest(item.method, item.url, item.body),
        timestamp: item.timestamp,
        retryCount: item.retryCount
      }));
    } catch {
      return [];
    }
  }

  clearQueue(): void {
    this.queue.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
```

**Offline Banner Component:**

```typescript
// components/offline-banner.component.ts
import { Component, inject } from '@angular/core';
import { NetworkService } from '../services/network.service';
import { OfflineQueueService } from '../services/offline-queue.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: `
    @if (!network.isOnline()) {
      <div class="offline-banner">
        <span>🔌 You are offline</span>
        @if (queue.queue().length > 0) {
          <span class="queue-count">
            {{ queue.queue().length }} request(s) queued
          </span>
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
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-weight: 500;
    }

    .queue-count {
      background: rgba(255, 255, 255, 0.3);
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

### 3. Request Deduplication & Caching

```typescript
// services/request-cache.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get(req: HttpRequest<any>): HttpResponse<any> | null {
    const key = this.getCacheKey(req);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT for ${req.url}`);
    return entry.response;
  }

  set(req: HttpRequest<any>, response: HttpResponse<any>): void {
    // Only cache GET requests
    if (req.method !== 'GET') return;

    const key = this.getCacheKey(req);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });

    console.log(`💾 Cached response for ${req.url}`);
  }

  clear(): void {
    this.cache.clear();
  }

  private getCacheKey(req: HttpRequest<any>): string {
    return `${req.method}:${req.urlWithParams}`;
  }
}
```

**Cache Interceptor:**

```typescript
// interceptors/cache.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, of } from 'rxjs';
import { RequestCacheService } from '../services/request-cache.service';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(RequestCacheService);

  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Check cache
  const cachedResponse = cache.get(req);
  if (cachedResponse) {
    return of(cachedResponse);
  }

  // Not in cache, proceed and cache response
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(req, event);
      }
    })
  );
};
```

---

### 4. Error Logging Service

```typescript
// services/error-logging.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface ErrorLog {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
  userId?: string;
  severity: 'error' | 'warning' | 'info';
  context?: any;
}

@Injectable({ providedIn: 'root' })
export class ErrorLoggingService {
  private http = inject(HttpClient);
  private errorFrequency = new Map<string, number>();

  logError(error: Error | HttpErrorResponse, context?: any): void {
    // Don't log in development (optional)
    if (!environment.production) {
      console.log('📊 Would log error in production:', error);
      return;
    }

    const errorLog: ErrorLog = {
      message: error.message,
      stack: error instanceof Error ? error.stack : undefined,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      severity: 'error',
      context
    };

    // Track frequency
    this.trackFrequency(error.message);

    // Send to analytics (mock endpoint)
    this.http.post('/api/logs/errors', errorLog, {
      headers: { 'X-Skip-Loading': 'true' } // Don't trigger loading spinner
    }).subscribe({
      error: (err) => console.error('Failed to log error:', err)
    });
  }

  private trackFrequency(message: string): void {
    const count = (this.errorFrequency.get(message) || 0) + 1;
    this.errorFrequency.set(message, count);

    // Alert if error happens too frequently
    if (count > 5) {
      console.warn(`⚠️ Error occurred ${count} times: ${message}`);
    }
  }

  getErrorFrequency(): Map<string, number> {
    return new Map(this.errorFrequency);
  }
}
```

---

### 5. Router Error Handling

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withNavigationErrorHandler((error) => {
        console.error('Navigation error:', error);

        // Handle lazy loading failures
        if (error.message.includes('ChunkLoadError')) {
          alert('Failed to load page. Please refresh and try again.');
          window.location.reload();
        }
      })
    )
  ]
};
```

**Custom Error Pages:**

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  // ... your routes
  { path: '404', component: NotFoundComponent },
  { path: '500', component: ServerErrorComponent },
  { path: '403', component: ForbiddenComponent },
  { path: '**', redirectTo: '/404' } // Catch-all
];
```

---

## ✅ Acceptance Criteria

### MEDIUM Challenge

**Global Error Handler:**
- [ ] Catches all unhandled runtime errors
- [ ] Differentiates client vs server errors
- [ ] Shows user-friendly toast notifications
- [ ] Logs errors with context

**HTTP Interceptor:**
- [ ] Handles all common status codes (400, 401, 403, 404, 500, 0)
- [ ] Shows appropriate messages for each error type
- [ ] Redirects to login on 401
- [ ] Extracts API error messages

**Retry Logic:**
- [ ] Retries network errors (status 0) automatically
- [ ] Max 3 retry attempts with 1s delay
- [ ] Does NOT retry 4xx errors
- [ ] Logs retry attempts

**Loading State:**
- [ ] Global spinner shows during HTTP requests
- [ ] Tracks concurrent requests correctly
- [ ] Can skip loading for specific requests

**Toast Notifications:**
- [ ] Shows success/error/warning/info toasts
- [ ] Auto-dismisses after 5 seconds
- [ ] Manual close button works
- [ ] Queues multiple toasts

**Error Display:**
- [ ] Reusable error component
- [ ] Shows error message + retry button
- [ ] Integrates with components

---

### HARD Challenge

**All Medium criteria PLUS:**

**Exponential Backoff:**
- [ ] Retry delays increase exponentially (1s, 2s, 4s, 8s)
- [ ] Jitter prevents thundering herd
- [ ] Configurable max retries
- [ ] Doesn't retry 4xx errors (except 408/429)

**Offline Handling:**
- [ ] Detects online/offline with signals
- [ ] Shows offline banner when disconnected
- [ ] Queues write operations when offline
- [ ] Auto-retries when back online
- [ ] Persists queue to localStorage
- [ ] Shows queue status

**Request Caching:**
- [ ] Caches GET requests
- [ ] Respects TTL (5 minutes)
- [ ] Prevents duplicate simultaneous requests
- [ ] Cache hit/miss logging

**Error Logging:**
- [ ] Logs errors to external service
- [ ] Includes context (user, URL, browser)
- [ ] Tracks error frequency
- [ ] Environment-aware (dev vs prod)

**Router Errors:**
- [ ] Handles navigation errors
- [ ] Retries failed lazy module loads
- [ ] Custom 404/500/403 pages
- [ ] Preserves URL on error

---

## 🧪 Testing Your Implementation

### Manual Test Cases

**Test Global Error Handler:**
```typescript
// Throw error in component
throw new Error('Test error');
// → Should show toast notification
```

**Test HTTP Errors:**
```typescript
// In component:
mockApi.getProduct404(999).subscribe(); // → 404 toast
mockApi.getProductsServerError().subscribe(); // → 500 toast
mockApi.getProtectedResource().subscribe(); // → 401 redirect
mockApi.getProductsNetworkError().subscribe(); // → Network error toast
```

**Test Retry Logic:**
```typescript
// Use flaky endpoint
mockApi.getFlakyProducts().subscribe({
  next: (products) => console.log('Success after retries:', products),
  error: (err) => console.error('Failed after retries:', err)
});
// → Should retry on failures, eventually succeed or fail after max retries
```

**Test Offline Queue:**
```typescript
// 1. Disconnect network (Chrome DevTools → Network → Offline)
// 2. Try to POST data
// 3. Check offline banner and queue status
// 4. Reconnect network
// 5. Verify queued request executes automatically
```

**Test Loading Spinner:**
```typescript
// Use slow endpoint
mockApi.getProductsSlow().subscribe();
// → Spinner shows for 5 seconds
```

---

## 📚 Resources

**Angular Error Handling:**
- [Advanced Angular Error Handling](https://dev.to/codewithrajat/advanced-angular-error-handling-best-practices-architecture-tips-code-examples-3939)
- [Mastering Error Handling in Angular](https://medium.com/@iammanishchauhan/%EF%B8%8F-mastering-error-handling-in-angular-from-local-try-catch-to-global-interceptors-4ff9dc929d9d)
- [How Do You Handle Errors in Angular?](https://medium.com/@ggrokz/how-do-you-handle-errors-in-angular-0c083772b8a8)
- [Global Error Handling in Angular](https://abp.io/community/articles/global-error-handling-in-angular-gjcb2f1e)
- [The Complete Angular Error Handling Guide](https://trackjs.com/blog/angular-error-handling/)

**Retry Strategies:**
- [Retrying Failed HTTP Requests with Exponential Backoff](https://levioconsulting.com/insights/retrying-failed-http-requests-using-exponential-backoff-rxjs-and-http-interceptors-in-angular/)
- [Retry Mechanism for Failed HTTP Requests](https://imran3.medium.com/retry-mechanism-for-failed-http-requests-angular-716bd9c092ba)
- [Angular Advanced HttpClient](https://medium.com/@thecodingdon/angular-advanced-httpclient-interceptors-retry-logic-and-request-cancellation-908fa5c85fde)

**Offline Handling:**
- [Detecting Online/Offline State in Angular](https://medium.com/@Angular_With_Awais/how-do-you-detect-online-offline-state-in-angular-without-rxjs-boilerplate-59d7bbdbad55)
- [Manage HTTP Downtime with Angular](https://netbasal.com/manage-http-downtime-with-angular-rxjs-and-http-interceptors-3e520b292ece)
- [Add Offline Capabilities to Angular App](https://www.daanstolp.nl/articles/2021/angular-pwa-2/)

**RxJS Operators:**
- [RxJS retry](https://rxjs.dev/api/index/function/retry)
- [RxJS retryWhen](https://rxjs.dev/api/index/function/retryWhen)
- [RxJS catchError](https://rxjs.dev/api/index/function/catchError)

---

## 💡 Interview Tips

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

## 🚀 Getting Started

1. Create new Angular project or use existing one
2. Implement Medium challenge first (foundation)
3. Test each piece individually (error handler, interceptor, toasts)
4. Add mock API endpoints that fail
5. Verify error handling works
6. Advance to Hard challenge (add offline, caching, retry)
7. Test offline scenarios
8. Polish UI/UX

---

**Good luck! Error handling is critical for production apps. Master this and you'll stand out in interviews.**
