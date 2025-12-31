# Challenge #5: RxJS Real-World Patterns - Product Search Dashboard

**Difficulty:** Medium-Hard
**Time Estimate:** 3-4 hours
**Focus:** Practical RxJS operators in real scenarios

---

## 🎯 Learning Objectives

- Master switchMap vs mergeMap vs concatMap vs exhaustMap (when to use each)
- Implement debounce and throttle for performance
- Combine multiple streams with combineLatest and forkJoin
- Handle errors with retry, retryWhen, catchError
- Prevent memory leaks with proper unsubscribe patterns
- Understand hot vs cold observables
- Use shareReplay for caching API responses

---

## 📋 Requirements

### Core Features

Build a **Product Search Dashboard** with these 6 real-world RxJS patterns:

---

### **1. Autocomplete Search** ⭐ Most Common Pattern

**Problem:** User types in search box, need to search without spamming the API

**Operators:** `debounceTime`, `distinctUntilChanged`, `switchMap`, `catchError`

**Requirements:**
- Wait 300ms after user stops typing before searching
- Cancel previous search if user types again (don't waste API calls)
- Don't search if the term hasn't changed
- Show loading spinner while searching
- Handle errors gracefully
- Clear results when search is empty

**Why these operators:**
- `debounceTime(300)` - wait for user to stop typing
- `distinctUntilChanged()` - don't search same term twice
- `switchMap()` - cancel previous request, only care about latest
- `catchError()` - handle API errors without breaking stream

---

### **2. Multiple Filter Dropdowns** ⭐ Combining Streams

**Problem:** User can filter by category, price range, and rating - need to combine all filters

**Operators:** `combineLatest`, `debounceTime`, `switchMap`

**Requirements:**
- 3 dropdowns: Category, Price Range (min/max), Rating (1-5 stars)
- When ANY filter changes, re-fetch products
- Combine all filter values into single API call
- Debounce filter changes (don't spam API)
- Show loading state during fetch
- Display result count

**Why these operators:**
- `combineLatest([category$, price$, rating$])` - emit when ANY changes
- `debounceTime(300)` - wait for user to finish adjusting filters
- `switchMap()` - cancel old request when filters change

---

### **3. Parallel API Calls on Page Load** ⭐ Wait for Multiple

**Problem:** Need to load products, categories, and user preferences before showing page

**Operators:** `forkJoin`, `catchError`, `map`

**Requirements:**
- Load 3 APIs in parallel: `/products`, `/categories`, `/user/preferences`
- Wait for ALL to complete before rendering
- Show loading spinner until all done
- If ANY fails, show error message
- Display success when all loaded
- Time the total load time

**Why these operators:**
- `forkJoin([products$, categories$, prefs$])` - wait for all, emit once
- Runs requests in parallel (faster than sequential)
- Only emits when all complete (or any errors)

---

### **4. Failed Request Retry with Backoff** ⭐ Error Handling

**Problem:** API sometimes fails, need to retry with exponential backoff

**Operators:** `retryWhen`, `delay`, `scan`, `takeWhile`, `catchError`

**Requirements:**
- Retry failed requests up to 3 times
- Exponential backoff: 1s, 2s, 4s
- Show retry attempts to user ("Retrying... 1/3")
- After 3 failures, show error with manual "Retry" button
- Log each retry attempt
- Don't retry on 4xx errors (client errors)

**Why these operators:**
- `retryWhen()` - custom retry logic
- `delay()` - wait between retries
- `scan()` - count retry attempts
- `takeWhile()` - stop after 3 tries

---

### **5. Infinite Scroll** ⭐ Throttling Events

**Problem:** Load more products when scrolling near bottom, but scroll fires 100+ times/sec

**Operators:** `throttleTime`, `filter`, `exhaustMap`, `scan`

**Requirements:**
- Detect when user scrolls to bottom 20% of page
- Throttle scroll events (check max every 200ms)
- Load next page of products
- Prevent loading while previous request in flight
- Append new products to existing list
- Show "Loading more..." indicator
- Disable when no more pages

**Why these operators:**
- `throttleTime(200)` - limit scroll event processing
- `filter()` - only trigger when near bottom
- `exhaustMap()` - ignore new scrolls while loading (prevent duplicates)
- `scan()` - accumulate pages of results

---

### **6. Batch File Upload** ⭐ Controlled Parallelism

**Problem:** Upload 10 images, but can't do all at once (server load), max 3 parallel

**Operators:** `mergeMap`, `from`, `tap`, `catchError`, `scan`

**Requirements:**
- User selects 10 images
- Upload max 3 at a time (controlled concurrency)
- Show progress bar for each upload
- Continue uploading even if one fails
- Show success/error for each file
- Display overall progress (7/10 completed)
- Don't block on failures

**Why these operators:**
- `mergeMap(upload, 3)` - max 3 parallel uploads
- `from(files)` - turn array into observable stream
- `catchError()` - handle individual failures without stopping others
- `scan()` - track overall progress

---

## 🏗️ Implementation Guide

### 1. Setup

```bash
ng new rxjs-dashboard --standalone
cd rxjs-dashboard

# Install RxJS (should be included, but just in case)
npm install rxjs
```

### 2. Project Structure

```
src/app/
├── components/
│   ├── search-bar/
│   │   └── search-bar.component.ts
│   ├── filters/
│   │   └── filters.component.ts
│   ├── product-list/
│   │   └── product-list.component.ts
│   ├── file-upload/
│   │   └── file-upload.component.ts
│   └── loader/
│       └── loader.component.ts
├── services/
│   ├── product.service.ts (API calls)
│   └── retry.service.ts (retry logic)
├── models/
│   └── product.model.ts
└── app.component.ts (main dashboard)
```

### 3. Pattern #1: Autocomplete Search

```typescript
// search-bar.component.ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="search-container">
      <input
        [formControl]="searchControl"
        placeholder="Search products..."
        type="text"
      />

      @if (loading) {
        <span class="spinner">🔄</span>
      }

      @if (error) {
        <span class="error">{{ error }}</span>
      }

      <div class="results">
        @for (product of results; track product.id) {
          <div class="result-item">{{ product.name }}</div>
        }
      </div>
    </div>
  `
})
export class SearchBarComponent {
  searchControl = new FormControl('');
  loading = false;
  error: string | null = null;
  results: any[] = [];

  constructor(private productService: ProductService) {
    this.searchControl.valueChanges.pipe(
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only if value actually changed
      filter(term => term !== null && term.length >= 2), // Min 2 chars
      switchMap(term =>
        // switchMap cancels previous request if new one comes in
        this.productService.searchProducts(term).pipe(
          catchError(err => {
            this.error = 'Search failed. Please try again.';
            return of([]); // Return empty array on error
          })
        )
      ),
      tap(() => this.loading = false)
    ).subscribe(results => {
      this.results = results;
    });
  }
}
```

**Key Points:**
- `debounceTime` prevents API spam
- `distinctUntilChanged` prevents duplicate searches
- `switchMap` cancels old requests (search for "angular", then quickly "react" - only "react" request completes)
- `catchError` keeps stream alive even after error

---

### 4. Pattern #2: Multiple Filter Dropdowns

```typescript
// filters.component.ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { debounceTime, switchMap, startWith } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="filters">
      <select [formControl]="categoryControl">
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="books">Books</option>
      </select>

      <input [formControl]="minPriceControl" type="number" placeholder="Min Price" />
      <input [formControl]="maxPriceControl" type="number" placeholder="Max Price" />

      <select [formControl]="ratingControl">
        <option value="0">All Ratings</option>
        <option value="4">4+ Stars</option>
        <option value="3">3+ Stars</option>
      </select>

      <div>Results: {{ resultCount }}</div>
    </div>
  `
})
export class FiltersComponent {
  categoryControl = new FormControl('');
  minPriceControl = new FormControl(0);
  maxPriceControl = new FormControl(1000);
  ratingControl = new FormControl(0);

  resultCount = 0;

  constructor(private productService: ProductService) {
    // Combine all filter changes into single stream
    combineLatest([
      this.categoryControl.valueChanges.pipe(startWith('')),
      this.minPriceControl.valueChanges.pipe(startWith(0)),
      this.maxPriceControl.valueChanges.pipe(startWith(1000)),
      this.ratingControl.valueChanges.pipe(startWith(0))
    ]).pipe(
      debounceTime(300), // Wait for user to finish adjusting
      switchMap(([category, minPrice, maxPrice, rating]) => {
        const filters: Filters = {
          category: category || '',
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 1000,
          rating: rating || 0
        };
        return this.productService.getFilteredProducts(filters);
      })
    ).subscribe(results => {
      this.resultCount = results.length;
    });
  }
}
```

**Key Points:**
- `combineLatest` emits when ANY filter changes
- `startWith` provides initial values
- `debounceTime` waits for user to finish adjusting sliders
- `switchMap` fetches with latest filter combination

---

### 5. Pattern #3: Parallel API Calls (forkJoin)

```typescript
// app.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from './services/product.service';

@Component({
  selector: 'app-root',
  template: `
    @if (loading()) {
      <div class="loading">Loading dashboard...</div>
    }

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @if (data()) {
      <div class="dashboard">
        <h2>Products: {{ data()!.products.length }}</h2>
        <h2>Categories: {{ data()!.categories.length }}</h2>
        <h2>User: {{ data()!.preferences.name }}</h2>
      </div>
    }
  `
})
export class AppComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<any>(null);

  constructor(private productService: ProductService) {}

  ngOnInit() {
    const startTime = Date.now();

    // Load all 3 APIs in parallel
    forkJoin({
      products: this.productService.getProducts(),
      categories: this.productService.getCategories(),
      preferences: this.productService.getUserPreferences()
    }).pipe(
      catchError(err => {
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
        throw err;
      })
    ).subscribe(result => {
      const loadTime = Date.now() - startTime;
      console.log(`Loaded all data in ${loadTime}ms`);

      this.data.set(result);
      this.loading.set(false);
    });
  }
}
```

**Key Points:**
- `forkJoin` waits for ALL observables to complete
- Runs in parallel (faster than sequential)
- If any fails, entire operation fails
- Emits single object with all results

**Alternative: Sequential with concatMap (slower but ordered)**
```typescript
this.productService.getProducts().pipe(
  concatMap(products =>
    this.productService.getCategories().pipe(
      map(categories => ({ products, categories }))
    )
  ),
  concatMap(data =>
    this.productService.getUserPreferences().pipe(
      map(preferences => ({ ...data, preferences }))
    )
  )
).subscribe(result => {
  // All loaded, but took longer
});
```

---

### 6. Pattern #4: Retry with Exponential Backoff

```typescript
// services/retry.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, finalize, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RetryService {
  retryWithBackoff<T>(
    maxRetries: number = 3,
    delayMs: number = 1000
  ) {
    let retries = 0;

    return (source: Observable<T>) => source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap(error => {
            retries++;

            // Don't retry client errors (4xx)
            if (error.status >= 400 && error.status < 500) {
              return throwError(() => error);
            }

            // Stop after max retries
            if (retries > maxRetries) {
              return throwError(() => new Error(`Failed after ${maxRetries} retries`));
            }

            // Exponential backoff: 1s, 2s, 4s
            const backoffTime = delayMs * Math.pow(2, retries - 1);
            console.log(`Retry ${retries}/${maxRetries} in ${backoffTime}ms...`);

            return timer(backoffTime);
          })
        )
      ),
      finalize(() => console.log('Request finished'))
    );
  }
}

// Usage in component:
this.productService.getProducts().pipe(
  this.retryService.retryWithBackoff(3, 1000),
  catchError(err => {
    this.error.set('Failed after 3 retries. Please try again.');
    return of([]);
  })
).subscribe(products => {
  this.products.set(products);
});
```

**Key Points:**
- `retryWhen` allows custom retry logic
- Exponential backoff prevents hammering server
- Skip retries for client errors (4xx)
- Log each attempt for debugging

---

### 7. Pattern #5: Infinite Scroll with Throttle

```typescript
// product-list.component.ts
import { Component, HostListener, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { throttleTime, filter, exhaustMap, scan, tap } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  template: `
    <div class="product-list">
      @for (product of allProducts(); track product.id) {
        <div class="product-card">{{ product.name }}</div>
      }

      @if (loading()) {
        <div class="loading-more">Loading more...</div>
      }

      @if (allLoaded()) {
        <div class="end-message">No more products</div>
      }
    </div>
  `
})
export class ProductListComponent {
  private scroll$ = new Subject<void>();

  allProducts = signal<any[]>([]);
  loading = signal(false);
  allLoaded = signal(false);

  private currentPage = 1;

  constructor(private productService: ProductService) {
    this.scroll$.pipe(
      throttleTime(200), // Only check scroll every 200ms
      filter(() => !this.loading() && !this.allLoaded()), // Don't load if already loading
      filter(() => this.isNearBottom()), // Only load near bottom
      tap(() => this.loading.set(true)),
      exhaustMap(() =>
        // exhaustMap ignores new emissions while previous request in flight
        this.productService.getProductsPage(this.currentPage)
      ),
      tap(() => this.loading.set(false))
    ).subscribe(newProducts => {
      if (newProducts.length === 0) {
        this.allLoaded.set(true);
      } else {
        this.allProducts.update(current => [...current, ...newProducts]);
        this.currentPage++;
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.scroll$.next();
  }

  private isNearBottom(): boolean {
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const threshold = pageHeight * 0.8; // 80% scrolled

    return scrollPosition >= threshold;
  }
}
```

**Key Points:**
- `throttleTime(200)` prevents processing 100+ scroll events/sec
- `exhaustMap` ignores scrolls while loading (prevents duplicate loads)
- `filter` guards prevent unnecessary API calls
- Accumulate results with signal update

---

### 8. Pattern #6: Batch Upload with Controlled Concurrency

```typescript
// file-upload.component.ts
import { Component, signal } from '@angular/core';
import { from, of } from 'rxjs';
import { mergeMap, catchError, scan, finalize } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';

interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

@Component({
  selector: 'app-file-upload',
  template: `
    <input type="file" (change)="onFilesSelected($event)" multiple />

    <div class="upload-list">
      @for (file of uploadProgress(); track file.fileName) {
        <div class="upload-item" [class]="file.status">
          <span>{{ file.fileName }}</span>
          <span>{{ file.status }}</span>
          <progress [value]="file.progress" max="100"></progress>
        </div>
      }
    </div>

    <div>Overall: {{ completedCount() }}/{{ totalCount() }}</div>
  `
})
export class FileUploadComponent {
  uploadProgress = signal<UploadProgress[]>([]);
  completedCount = signal(0);
  totalCount = signal(0);

  constructor(private productService: ProductService) {}

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    this.totalCount.set(files.length);

    // Initialize progress tracking
    this.uploadProgress.set(
      files.map(f => ({
        fileName: f.name,
        status: 'pending',
        progress: 0
      }))
    );

    // Upload files with max 3 concurrent uploads
    from(files).pipe(
      mergeMap(file =>
        this.uploadFile(file).pipe(
          catchError(err => {
            // Handle individual file errors without stopping others
            this.updateFileStatus(file.name, 'error', 0, err.message);
            return of(null);
          })
        ),
        3 // Max 3 parallel uploads
      ),
      scan((acc, result) => acc + 1, 0), // Count completions
      finalize(() => console.log('All uploads finished'))
    ).subscribe(completed => {
      this.completedCount.set(completed);
    });
  }

  private uploadFile(file: File) {
    this.updateFileStatus(file.name, 'uploading', 0);

    return this.productService.uploadImage(file).pipe(
      tap(progress => {
        this.updateFileStatus(file.name, 'uploading', progress);
      }),
      finalize(() => {
        this.updateFileStatus(file.name, 'success', 100);
      })
    );
  }

  private updateFileStatus(
    fileName: string,
    status: UploadProgress['status'],
    progress: number,
    error?: string
  ) {
    this.uploadProgress.update(list =>
      list.map(item =>
        item.fileName === fileName
          ? { ...item, status, progress, error }
          : item
      )
    );
  }
}
```

**Key Points:**
- `mergeMap(upload, 3)` - max 3 concurrent uploads
- `from(files)` converts array to observable stream
- `catchError` per file - one failure doesn't stop others
- `scan` tracks overall progress

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Search autocomplete works (debounce + switchMap)
- [ ] Filters combine correctly (combineLatest)
- [ ] Page load fetches 3 APIs in parallel (forkJoin)
- [ ] Failed requests retry 3 times with backoff
- [ ] Infinite scroll loads more products (throttle + exhaustMap)
- [ ] File upload max 3 concurrent (mergeMap with concurrency)
- [ ] No memory leaks (proper unsubscribe)
- [ ] Loading states for all async operations
- [ ] Error handling for all API calls

### Should Have
- [ ] Visual feedback for all operations
- [ ] Retry count displayed during retries
- [ ] Upload progress bars
- [ ] Result counts displayed
- [ ] Console logs for debugging

### Nice to Have
- [ ] Unit tests for each RxJS pattern
- [ ] Comparison chart showing operator differences
- [ ] Marble diagrams for each pattern
- [ ] Performance metrics (API call counts)
- [ ] Cancel buttons for in-flight requests

---

## 🎓 Operator Decision Tree

**When to use which operator:**

```
Need to make HTTP request based on user input?
├─ Only care about latest? → switchMap (search, autocomplete)
├─ All requests matter? → mergeMap (file uploads, analytics)
├─ Order matters? → concatMap (sequential operations)
└─ Ignore while busy? → exhaustMap (save button, login)

Need to combine multiple streams?
├─ Wait for all to complete? → forkJoin (parallel page load)
├─ Emit when any changes? → combineLatest (filters)
├─ Pair emissions? → zip (rarely used)
└─ Latest from one? → withLatestFrom (context enrichment)

Need to limit emissions?
├─ Wait for pause? → debounceTime (search input)
├─ Limit rate? → throttleTime (scroll, resize)
├─ First/last only? → audit, sample
└─ Take N? → take, first, last

Need to handle errors?
├─ Retry automatically? → retry(3)
├─ Retry with logic? → retryWhen (backoff)
├─ Fallback value? → catchError(() => of(default))
└─ Let it fail? → no operator needed
```

---

## 📚 Resources

**RxJS Operators:**
- [Learn RxJS](https://www.learnrxjs.io/)
- [RxJS Higher Order Mapping](https://blog.angular-university.io/rxjs-higher-order-mapping/)
- [switchMap Real-Life Use Cases](https://blog.bryanhannes.com/real-life-use-cases-for-rxjs-switchmap-in-angular/)

**Combination Operators:**
- [forkJoin vs combineLatest](https://www.digitalocean.com/community/tutorials/rxjs-operators-forkjoin-zip-combinelatest-withlatestfrom)
- [combineLatest Guide](https://www.learnrxjs.io/learn-rxjs/operators/combination/combinelatest)

**Debounce vs Throttle:**
- [Debounce vs Throttle vs Audit vs Sample](https://dev.to/rxjs/debounce-vs-throttle-vs-audit-vs-sample-difference-you-should-know-1f21)
- [Debouncing and Throttling in Angular](https://www.ryadel.com/en/debouncing-throttling-angular-rxjs-typescript/)

**Interview Prep:**
- [Top RxJS Interview Questions](https://testbook.com/interview/angular-rxjs-interview-questions)

---

## 💡 Hints & Tips

1. **Memory Leaks** - Always unsubscribe! Use `takeUntilDestroyed()` in components
2. **switchMap vs mergeMap** - switchMap cancels, mergeMap runs all
3. **debounce vs throttle** - debounce waits for pause, throttle limits rate
4. **forkJoin** - only emits once when ALL complete
5. **combineLatest** - emits every time ANY changes
6. **exhaustMap** - perfect for buttons (ignore clicks while saving)
7. **shareReplay** - cache HTTP responses
8. **tap** - side effects (logging) without changing stream

---

## 🚀 Getting Started

1. Create new Angular app
2. Build mock API service with delays
3. Implement Pattern #1 (search) first - most common
4. Test with console.log to see operator behavior
5. Add Patterns #2-6 one at a time
6. Test each pattern thoroughly
7. Add error cases and edge cases
8. Measure performance (network tab)
9. Document which operators you used and why

---

## 🧪 Testing Each Pattern

**Pattern #1 - Search:**
- Type "ang" → wait 300ms → API call
- Type "angular" quickly → only 1 API call (last one)
- Type same term twice → only 1 API call

**Pattern #2 - Filters:**
- Change category → API call
- Change price + rating quickly → 1 API call (combined)

**Pattern #3 - forkJoin:**
- Disable network for one endpoint → all fail
- Check parallel timing (faster than sequential)

**Pattern #4 - Retry:**
- Simulate 500 error → retries 3 times with backoff
- Simulate 404 error → no retries

**Pattern #5 - Infinite Scroll:**
- Scroll fast → throttled to 200ms
- While loading → ignores new scrolls

**Pattern #6 - Upload:**
- Upload 10 files → only 3 at a time
- One fails → others continue

---

**This challenge covers 90% of real-world RxJS usage. Master these patterns and you'll dominate Angular interviews!**
