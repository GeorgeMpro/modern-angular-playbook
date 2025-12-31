# Challenge #2: Resources API + HTTP - GitHub User Search

**Difficulty:** Medium
**Time Estimate:** 2-3 hours
**Angular Version:** 19-21
**New Feature:** Resources API (resource() primitive)

---

## 🎯 Learning Objectives

- Use the `resource()` primitive for async data fetching
- Understand automatic loading/error state management
- Implement request cancellation with Resources API
- Work with dependent resources (user → repos)
- Compare Resources API vs traditional Observable approach
- Handle GitHub API rate limiting

---

## 📋 Requirements

### Core Features

**Search Functionality**
- Search input for GitHub username
- Debounced search (300ms)
- Search as you type (no submit button needed)
- Display search results (list of users)
- Clear search button

**User Profile Display**
- Avatar image
- Username and real name
- Bio/description
- Location
- Public repos count
- Followers count
- Following count
- Profile link to GitHub
- Member since date

**Repositories List** (Dependent Resource)
- Load repos when user is selected
- Display repo name
- Description
- Stars count
- Forks count
- Primary language
- Last updated date
- Link to repository
- Sort by: stars, updated, name

### Technical Requirements

1. **Resources API Implementation**
   ```typescript
   // Use resource() for user search
   const users = resource({
     request: () => searchTerm(),
     loader: async ({ request }) => {
       const response = await fetch(`https://api.github.com/search/users?q=${request}`);
       return response.json();
     }
   });
   ```

2. **Automatic State Management**
   - Loading state handled by resource
   - Error state handled by resource
   - No manual loading/error flags needed
   - Display loading spinner during fetch
   - Display error message on failure

3. **Request Cancellation**
   - Previous requests automatically cancelled when search term changes
   - No need for manual switchMap/takeUntil
   - Resources API handles cleanup

4. **Dependent Resources**
   - Repos resource depends on selected user
   - Load repos only when user is selected
   - Clear repos when user is deselected

5. **User Experience**
   - Skeleton loaders during fetch
   - Empty state (no search performed)
   - No results found state
   - Error handling with retry button
   - Responsive design (mobile-friendly)

### Bonus Challenges

- [ ] Add pagination for search results (GitHub API supports this)
- [ ] Cache search results (don't refetch same username)
- [ ] Add repo filtering (by language, stars threshold)
- [ ] Implement infinite scroll for repositories
- [ ] Add "Compare Users" feature (side-by-side view)
- [ ] Build the same app using traditional Observables and compare code
- [ ] Add charts (contributions graph using Canvas/Chart.js)
- [ ] Handle GitHub API rate limiting gracefully
- [ ] Add dark mode toggle

---

## 🏗️ Implementation Guide

### 1. Setup

```bash
# Create new Angular app
ng new github-search-resources --standalone --routing=false

cd github-search-resources
```

### 2. Component Structure

```
src/app/
├── components/
│   ├── search-bar/
│   │   └── search-bar.component.ts
│   ├── user-list/
│   │   └── user-list.component.ts
│   ├── user-profile/
│   │   └── user-profile.component.ts
│   ├── repo-list/
│   │   └── repo-list.component.ts
│   └── loading-skeleton/
│       └── loading-skeleton.component.ts
├── models/
│   ├── github-user.model.ts
│   └── github-repo.model.ts
├── services/
│   └── github-api.service.ts
└── app.component.ts
```

### 3. Resources API Examples

**Basic Resource:**
```typescript
import { resource, signal } from '@angular/core';

export class GitHubSearchComponent {
  searchTerm = signal('');

  // Resource automatically tracks searchTerm changes
  users = resource({
    request: () => this.searchTerm(),
    loader: async ({ request, abortSignal }) => {
      if (!request) return { items: [] };

      const response = await fetch(
        `https://api.github.com/search/users?q=${request}`,
        { signal: abortSignal } // Automatic cancellation
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return response.json();
    }
  });

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    // Resource automatically refetches!
  }
}
```

**Template Usage:**
```html
<!-- Loading state -->
<div *ngIf="users.isLoading()">
  <app-loading-skeleton />
</div>

<!-- Error state -->
<div *ngIf="users.error()">
  <p>Error: {{ users.error()?.message }}</p>
  <button (click)="users.reload()">Retry</button>
</div>

<!-- Success state -->
<div *ngIf="users.value() as data">
  <div *ngFor="let user of data.items">
    {{ user.login }}
  </div>
</div>
```

**Dependent Resource (Repos based on selected user):**
```typescript
selectedUser = signal<string | null>(null);

repos = resource({
  request: () => this.selectedUser(),
  loader: async ({ request, abortSignal }) => {
    if (!request) return [];

    const response = await fetch(
      `https://api.github.com/users/${request}/repos?sort=updated&per_page=30`,
      { signal: abortSignal }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return response.json();
  }
});

selectUser(username: string) {
  this.selectedUser.set(username);
  // repos resource automatically refetches!
}
```

### 4. GitHub API Reference

**Search Users:**
```
GET https://api.github.com/search/users?q={username}
```

**Get User Details:**
```
GET https://api.github.com/users/{username}
```

**Get User Repos:**
```
GET https://api.github.com/users/{username}/repos?sort=updated&per_page=30
```

**Rate Limiting:**
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour
- Check headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 5. TypeScript Models

```typescript
// models/github-user.model.ts
export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubUser[];
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  bio?: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

// models/github-repo.model.ts
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  topics: string[];
}
```

### 6. Debounced Search Input

```typescript
import { signal, effect } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export class SearchBarComponent {
  searchControl = new FormControl('');
  searchTerm = signal('');

  constructor() {
    // Bridge between FormControl and signal
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchTerm.set(value || '');
    });
  }
}
```

Or with pure signals (no RxJS):
```typescript
import { signal, effect } from '@angular/core';

export class SearchBarComponent {
  private inputValue = signal('');
  searchTerm = signal('');
  private debounceTimer: any;

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchTerm.set(value);
    }, 300);
  }
}
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Search GitHub users by username (debounced)
- [ ] Display list of search results with avatars
- [ ] Click user to view full profile
- [ ] Display user profile with all required fields
- [ ] Load and display user's repositories
- [ ] Automatic loading states (via resource.isLoading())
- [ ] Automatic error handling (via resource.error())
- [ ] Request cancellation when search term changes
- [ ] Responsive design (mobile + desktop)

### Should Have
- [ ] Skeleton loaders during fetch
- [ ] Empty state message
- [ ] No results found message
- [ ] Retry button on error
- [ ] Clear search button
- [ ] Sort repos by stars/updated/name
- [ ] Link to GitHub profile and repos

### Nice to Have
- [ ] Pagination for search results
- [ ] Infinite scroll for repositories
- [ ] Result caching
- [ ] Dark mode
- [ ] Compare users feature
- [ ] Rate limit warning
- [ ] Comparison with Observable implementation

---

## 🧪 Testing Strategy

**Manual Testing Checklist:**
- [ ] Search for "octocat" → results appear
- [ ] Change search to "torvalds" → previous request cancelled, new results appear
- [ ] Click on a user → profile loads
- [ ] Profile shows repositories → repos load
- [ ] Trigger API error (invalid username) → error message shows
- [ ] Click retry → refetches data
- [ ] Clear search → results disappear
- [ ] Test on mobile viewport → responsive layout

**Edge Cases:**
- [ ] Empty search term → no API call
- [ ] Search with special characters → properly encoded
- [ ] Very long username → UI handles gracefully
- [ ] User with 0 repos → empty state message
- [ ] Rate limit exceeded → user-friendly error

---

## 📚 Resources

**Angular Resources API:**
- [Angular Resources Guide](https://angular.dev/guide/signals/resource)
- [Angular v21 Announcement](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- [Angular & RxJS in 2025](https://dev.to/cristiansifuentes/angular-rxjs-in-2025-the-experts-playbook-signals-rxjs-8-and-interop-28ed)

**GitHub API:**
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Search Users Endpoint](https://docs.github.com/en/rest/search#search-users)
- [Users Endpoint](https://docs.github.com/en/rest/users)
- [Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

**Signals:**
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Signals Complete Guide](https://blog.angular-university.io/angular-signals/)

---

## 🎓 Key Learnings

After completing this challenge, you should understand:

1. **Resources API** - How to use `resource()` for async data fetching
2. **Automatic state management** - Loading/error states without manual flags
3. **Request cancellation** - Automatic cleanup with abortSignal
4. **Dependent resources** - Chain resources (user → repos)
5. **Signals + HTTP** - Modern Angular pattern for data fetching
6. **Real API integration** - Working with external APIs, rate limits, error handling

---

## 🔄 Comparison Challenge

After building with Resources API, optionally build the same app using **traditional Observables** and compare:

**Observable approach:**
```typescript
import { HttpClient } from '@angular/common/http';
import { switchMap, debounceTime, catchError } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

export class GitHubSearchObservablesComponent {
  searchTerm$ = new BehaviorSubject('');
  loading = signal(false);
  error = signal<Error | null>(null);

  users$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => this.loading.set(true)),
    switchMap(term => this.http.get(`...${term}`)),
    tap(() => this.loading.set(false)),
    catchError(err => {
      this.error.set(err);
      this.loading.set(false);
      return of([]);
    })
  );
}
```

**Compare:**
- Lines of code
- Boilerplate (loading/error flags)
- Request cancellation complexity
- Type safety
- Developer experience
- Testability

---

## 💡 Hints & Tips

1. **Start with basic search** - Get user search working first, then add profile/repos
2. **Use the abortSignal** - Pass it to fetch() for automatic cancellation
3. **Handle empty states** - Check if request is empty before fetching
4. **GitHub API is free** - No auth needed (but has rate limits)
5. **Use Chrome DevTools Network tab** - See request cancellation in action
6. **Console.log resource states** - `users.isLoading()`, `users.value()`, `users.error()`
7. **TypeScript models** - Define interfaces for GitHub API responses
8. **Responsive images** - Use GitHub avatar URLs (already optimized)

---

## 🚀 Getting Started

1. Create new Angular app
2. Build search bar component with debounced input
3. Implement users resource with search endpoint
4. Display search results in a list
5. Add user selection (click to view profile)
6. Implement user profile resource (dependent on selected user)
7. Implement repos resource (dependent on selected user)
8. Add loading/error states UI
9. Polish responsive design
10. (Optional) Build Observable comparison version

---

**Remember: Resources API = less boilerplate, automatic cleanup, simpler code. Perfect for modern Angular!**
