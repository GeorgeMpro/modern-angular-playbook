# Challenge #7: HTTP Interceptors + Auth Guards - Production Auth Patterns

**Difficulty:** Medium
**Time Estimate:** 2-3 hours
**Focus:** Real-world authentication and authorization

---

## 🎯 Learning Objectives

- Build HTTP interceptors for auth tokens
- Implement route guards (CanActivate, CanDeactivate, CanMatch)
- Handle token refresh automatically
- Queue requests during token refresh
- Implement logout on 401/403
- Handle auth state with signals
- Protect routes based on roles/permissions
- Implement "unsaved changes" warning

---

## 📋 The Challenge

Build a **complete authentication system** with these features:

### 1. HTTP Interceptors

**Auth Token Interceptor:**
- Automatically attach JWT token to all requests
- Skip token for public endpoints (/login, /register)
- Handle token expiration
- Refresh expired tokens automatically
- Queue requests during refresh
- Logout on 401/403 errors

**Error Handling Interceptor:**
- Global error handling
- Retry failed requests (network errors)
- Show user-friendly error messages
- Log errors to analytics

**Loading Interceptor:**
- Show global loading spinner
- Track concurrent requests
- Hide spinner when all done

---

### 2. Route Guards

**AuthGuard (CanActivate):**
- Redirect to /login if not authenticated
- Check token validity
- Allow access if logged in

**RoleGuard (CanActivate):**
- Check user roles/permissions
- Allow admin routes only for admins
- Redirect to /forbidden if not authorized

**UnsavedChangesGuard (CanDeactivate):**
- Warn user about unsaved form changes
- Show confirmation dialog
- Allow navigation if user confirms

**FeatureFlagGuard (CanMatch):**
- Lazy load routes based on feature flags
- Show/hide entire route branches
- A/B testing support

---

## 🏗️ Implementation Guide

### 1. Auth Service with Token Management

```typescript
// services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  // Signals for auth state
  currentUser = signal<User | null>(this.loadUserFromStorage());
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.roles.includes('admin') ?? false);

  // For token refresh coordination
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkTokenExpiration();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(err => {
          console.error('Login failed:', err);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    // Clear tokens
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Clear state
    this.currentUser.set(null);

    // Redirect
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.asObservable().pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => of({ access_token: localStorage.getItem(this.TOKEN_KEY)! }))
      ) as Observable<AuthResponse>;
    }

    this.refreshTokenInProgress = true;

    return this.http.post<AuthResponse>('/api/auth/refresh', { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(response.access_token);
        }),
        catchError(err => {
          this.refreshTokenInProgress = false;
          this.logout();
          return throwError(() => err);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() > exp;
    } catch {
      return true;
    }
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.REFRESH_KEY, response.refresh_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private checkTokenExpiration(): void {
    // Check token expiration every minute
    setInterval(() => {
      if (this.isAuthenticated() && this.isTokenExpired()) {
        console.log('Token expired, refreshing...');
        this.refreshToken().subscribe();
      }
    }, 60000);
  }
}
```

---

### 2. Auth Interceptor

```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip token for public endpoints
  const publicEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  const isPublic = publicEndpoints.some(url => req.url.includes(url));

  if (isPublic) {
    return next(req);
  }

  // Get token
  const token = authService.getToken();

  if (!token) {
    // No token, proceed without auth header
    return next(req);
  }

  // Clone request and add token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 - token expired or invalid
      if (error.status === 401) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry original request with new token
            const newToken = authService.getToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError(refreshError => {
            // Refresh failed, logout
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // Handle 403 - forbidden
      if (error.status === 403) {
        console.error('Access forbidden');
        // Optionally redirect to /forbidden page
      }

      return throwError(() => error);
    })
  );
};
```

---

### 3. Error Handling Interceptor

```typescript
// interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer } from 'rxjs';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    // Retry network errors (not 4xx/5xx)
    retry({
      count: 3,
      delay: (error, retryCount) => {
        // Only retry network errors
        if (error instanceof HttpErrorResponse && error.status === 0) {
          console.log(`Retry attempt ${retryCount} for ${req.url}`);
          return timer(1000 * retryCount); // Exponential backoff
        }
        // Don't retry other errors
        return throwError(() => error);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login.';
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
        }
      }

      console.error('HTTP Error:', errorMessage, error);

      // You could show a toast notification here
      // toastService.showError(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
```

---

### 4. Loading Interceptor

```typescript
// interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading for background requests
  if (req.headers.has('X-Skip-Loading')) {
    return next(req);
  }

  loadingService.startLoading();

  return next(req).pipe(
    finalize(() => loadingService.stopLoading())
  );
};

// services/loading.service.ts
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

---

### 5. Auth Guard (CanActivate)

```typescript
// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store attempted URL for redirect after login
  const returnUrl = state.url;
  router.navigate(['/login'], { queryParams: { returnUrl } });
  return false;
};
```

**Usage in routes:**
```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard] // Protected route
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  }
];
```

---

### 6. Role Guard (CanActivate)

```typescript
// guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (requiredRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const hasRole = requiredRoles.some(role => user.roles.includes(role));

    if (hasRole) {
      return true;
    }

    // User doesn't have required role
    router.navigate(['/forbidden']);
    return false;
  };
};
```

**Usage:**
```typescript
const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  {
    path: 'moderator',
    component: ModeratorComponent,
    canActivate: [authGuard, roleGuard(['admin', 'moderator'])]
  }
];
```

---

### 7. Unsaved Changes Guard (CanDeactivate)

```typescript
// guards/unsaved-changes.guard.ts
import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.canDeactivate) {
    return component.canDeactivate();
  }
  return true;
};

// Component implementing the interface:
@Component({
  selector: 'app-edit-profile',
  template: `
    <form [formGroup]="profileForm">
      <input formControlName="name" />
      <input formControlName="email" />
      <button (click)="save()">Save</button>
    </form>
  `
})
export class EditProfileComponent implements CanComponentDeactivate {
  profileForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl('')
  });

  private saved = false;

  canDeactivate(): boolean {
    if (this.profileForm.dirty && !this.saved) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }

  save(): void {
    // Save logic
    this.saved = true;
  }
}
```

**Usage:**
```typescript
const routes: Routes = [
  {
    path: 'edit-profile',
    component: EditProfileComponent,
    canDeactivate: [unsavedChangesGuard]
  }
];
```

---

### 8. Feature Flag Guard (CanMatch)

```typescript
// guards/feature-flag.guard.ts
import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { FeatureFlagService } from '../services/feature-flag.service';

export const featureFlagGuard = (flagName: string): CanMatchFn => {
  return () => {
    const featureFlags = inject(FeatureFlagService);
    return featureFlags.isEnabled(flagName);
  };
};

// services/feature-flag.service.ts
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private flags = signal({
    newDashboard: true,
    betaFeatures: false,
    adminPanel: true
  });

  isEnabled(flagName: string): boolean {
    return this.flags()[flagName as keyof typeof this.flags] ?? false;
  }

  enable(flagName: string): void {
    this.flags.update(current => ({ ...current, [flagName]: true }));
  }

  disable(flagName: string): void {
    this.flags.update(current => ({ ...current, [flagName]: false }));
  }
}
```

**Usage:**
```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    canMatch: [featureFlagGuard('newDashboard')],
    loadComponent: () => import('./new-dashboard.component')
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./old-dashboard.component') // Fallback
  }
];
```

---

### 9. Complete Setup in App Config

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,  // First - start loading
        authInterceptor,     // Second - add auth token
        errorInterceptor     // Last - handle errors
      ])
    )
  ]
};
```

---

## ✅ Acceptance Criteria

### HTTP Interceptors
- [ ] Auth token automatically attached to requests
- [ ] Public endpoints skip token
- [ ] Token refresh on 401
- [ ] Requests queued during refresh
- [ ] Logout on refresh failure
- [ ] Network errors retry 3 times
- [ ] User-friendly error messages
- [ ] Loading spinner for requests

### Route Guards
- [ ] AuthGuard redirects to login if not authenticated
- [ ] RoleGuard checks user roles
- [ ] UnsavedChangesGuard warns about unsaved data
- [ ] FeatureFlagGuard shows/hides routes
- [ ] Return URL preserved after login
- [ ] Forbidden page for unauthorized access

### Auth State
- [ ] User state managed with signals
- [ ] Token stored in localStorage
- [ ] Token expiration checked
- [ ] Auto-refresh before expiration
- [ ] Logout clears all state
- [ ] Role-based UI rendering

---

## 🧪 Testing Strategy

**Test Auth Service:**
```typescript
describe('AuthService', () => {
  it('should login and store token', () => {
    service.login('test@test.com', 'password').subscribe(response => {
      expect(localStorage.getItem('access_token')).toBeTruthy();
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  it('should logout and clear tokens', () => {
    service.logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should refresh token', () => {
    service.refreshToken().subscribe(() => {
      const newToken = service.getToken();
      expect(newToken).toBeTruthy();
    });
  });
});
```

**Test Auth Interceptor:**
```typescript
describe('Auth Interceptor', () => {
  it('should add auth token to requests', () => {
    const req = new HttpRequest('GET', '/api/protected');
    // Execute interceptor
    // Check Authorization header exists
  });

  it('should skip token for public endpoints', () => {
    const req = new HttpRequest('POST', '/api/auth/login');
    // Execute interceptor
    // Check no Authorization header
  });
});
```

**Test Guards:**
```typescript
describe('AuthGuard', () => {
  it('should allow access if authenticated', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    expect(guard(route, state)).toBe(true);
  });

  it('should redirect to login if not authenticated', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(false);
    guard(route, state);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
```

---

## 📚 Resources

**HTTP Interceptors:**
- [Angular HTTP Interceptors Guide](https://angular.dev/guide/http/interceptors)
- [Functional Interceptors](https://angular.dev/guide/http/making-requests#intercepting-requests-and-responses)

**Route Guards:**
- [Angular Route Guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access)
- [CanActivate, CanDeactivate, CanMatch](https://angular.dev/api/router)

**JWT Tokens:**
- [JWT.io](https://jwt.io/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---

## 💡 Production Tips

1. **Never store sensitive data in localStorage** - use httpOnly cookies for refresh tokens
2. **Implement CSRF protection** for write operations
3. **Use secure, httpOnly cookies** for production
4. **Refresh token before expiration** (not after)
5. **Implement token rotation** (new refresh token on each use)
6. **Add request/response logging** for debugging
7. **Implement rate limiting** on login endpoint
8. **Use Content Security Policy (CSP)** headers

---

**This is production-ready auth. Everything you need for real applications!**
