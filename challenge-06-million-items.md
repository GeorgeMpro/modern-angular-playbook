# Challenge #6: Million Items Performance - Virtual Scrolling + Optimization

**Difficulty:** Hard
**Time Estimate:** 4-6 hours
**Focus:** Performance optimization for massive datasets

-

## 🎯 Learning Objectives

- Implement virtual scrolling with CDK
- Handle 1,000,000+ items without crashing browser
- Optimize search/filter for large datasets
- Use Web Workers for heavy computation
- Implement infinite scroll with pagination
- Combine: virtual scroll + debounce + signals + OnPush + trackBy
- Instrument and display **live** performance metrics (FPS, long tasks, rendered DOM node count) instead of only checking DevTools by hand
- Toggle virtualized vs. non-virtualized rendering to **prove** the technique works, not just assert it

---

## 📋 The Challenge

Build a **Product Catalog** that can handle **1 MILLION items** smoothly:

**Performance Requirements:**
- Initial render < 2 seconds
- Scroll smoothly (60 FPS)
- Search response < 500ms
- Filter update < 300ms
- Memory usage < 500MB
- No UI freezing/blocking
- A live side panel showing FPS, long-task count, and rendered DOM node count — visible in the running app, not only in DevTools
- A toggle to switch between virtualized and non-virtualized rendering, for direct side-by-side proof

**You MUST combine ALL these techniques:**
1. Virtual scrolling (only render visible items)
2. Debounced search (don't spam on every keystroke)
3. Infinite scroll (load data in chunks)
4. Web Workers (offload filtering to background thread)
5. OnPush change detection
6. TrackBy functions
7. Signals for state management
8. Index-based search (not linear scan)

---

## 🏗️ Core Features

### 1. Data Generation & Storage

**Generate 1M items efficiently:**
```typescript
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
}

// Generate 1M products efficiently
function generateProducts(count: number): Product[] {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  const products: Product[] = [];

  for (let i = 0; i < count; i++) {
    products.push({
      id: i,
      name: `Product ${i}`,
      category: categories[i % categories.length],
      price: Math.random() * 1000,
      rating: Math.floor(Math.random() * 5) + 1,
      inStock: Math.random() > 0.2
    });
  }

  return products;
}
```

**Requirements:**
- Generate 1M items on app start
- Store in service (singleton)
- Build search index (Map by name prefix)
- Build filter index (Map by category, price range, rating)

---

### 2. Virtual Scrolling with CDK

**Only render visible items (20-50 DOM elements instead of 1M):**

```typescript
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-product-list',
  imports: [ScrollingModule, CommonModule],
  template: `
    <cdk-virtual-scroll-viewport
      itemSize="50"
      class="viewport"
      (scrolledIndexChange)="onScroll($event)">

      <div
        *cdkVirtualFor="let product of displayedProducts(); trackBy: trackById"
        class="product-item">
        <span>{{ product.name }}</span>
        <span>{{ product.category }}</span>
        <span>\${{ product.price | number:'1.2-2' }}</span>
        <span>⭐ {{ product.rating }}</span>
      </div>

      @if (loading()) {
        <div class="loading">Loading more...</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 600px;
      width: 100%;
      border: 1px solid #ccc;
    }

    .product-item {
      height: 50px;
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
  `]
})
export class ProductListComponent {
  displayedProducts = signal<Product[]>([]);
  loading = signal(false);

  trackById = (index: number, item: Product) => item.id;

  // Virtual scrolling handles rendering, you handle data loading
}
```

**Requirements:**
- Fixed item height (50px) for best performance
- ViewPort height: 600px (shows ~12 items)
- Only 20-50 DOM elements exist at any time
- Smooth scrolling with trackBy

---

### 3. Debounced Search with Index

**Don't search linearly through 1M items - use an index!**

```typescript
// service/product-index.service.ts
@Service()
export class ProductIndexService {
  private allProducts: Product[] = [];
  private nameIndex = new Map<string, Product[]>(); // Prefix → products
  private categoryIndex = new Map<string, Product[]>();

  constructor() {
    this.allProducts = this.generateProducts(1_000_000);
    this.buildIndexes();
  }

  private buildIndexes() {
    console.time('Building indexes');

    // Build name prefix index (for fast search)
    this.allProducts.forEach(product => {
      const name = product.name.toLowerCase();
      for (let i = 1; i <= Math.min(name.length, 10); i++) {
        const prefix = name.substring(0, i);
        if (!this.nameIndex.has(prefix)) {
          this.nameIndex.set(prefix, []);
        }
        this.nameIndex.get(prefix)!.push(product);
      }
    });

    // Build category index
    this.allProducts.forEach(product => {
      if (!this.categoryIndex.has(product.category)) {
        this.categoryIndex.set(product.category, []);
      }
      this.categoryIndex.get(product.category)!.push(product);
    });

    console.timeEnd('Building indexes'); // ~2-3 seconds for 1M items
  }

  search(term: string): Product[] {
    if (!term) return this.allProducts;

    const prefix = term.toLowerCase();
    return this.nameIndex.get(prefix) || [];
  }

  filterByCategory(category: string): Product[] {
    if (!category) return this.allProducts;
    return this.categoryIndex.get(category) || [];
  }

  // Complex filter combining multiple criteria
  complexFilter(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
  }): Product[] {
    let results = this.allProducts;

    if (filters.category) {
      results = this.categoryIndex.get(filters.category) || [];
    }

    // Filter remaining criteria
    if (filters.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice!);
    }
    if (filters.rating !== undefined) {
      results = results.filter(p => p.rating >= filters.rating!);
    }

    return results;
  }
}
```

**Component with debounced search:**
```typescript
interface SearchData {
  query: string;
}

@Component({
  selector: 'app-search',
  imports: [FormField],
  template: `
    <input
      [formField]="searchForm.query"
      placeholder="Search 1M products..."
      type="text"
    />
    <div>Found: {{ resultCount() | number }} products in {{ searchTime() }}ms</div>
  `
})
export class SearchComponent {
  private readonly indexService = inject(ProductIndexService);

  private readonly searchModel = signal<SearchData>({ query: '' });
  protected readonly searchForm = form(this.searchModel);

  resultCount = signal(0);
  searchTime = signal(0);

  private readonly results$ = toObservable(this.searchForm.query().value).pipe(
    debounceTime(300),
    tap(() => console.time('Search')),
    map(term => {
      const start = performance.now();
      const results = this.indexService.search(term || '');
      const duration = performance.now() - start;

      this.searchTime.set(Math.round(duration));
      this.resultCount.set(results.length);

      console.timeEnd('Search');
      return results;
    })
  );

  protected readonly results = toSignal(this.results$, { initialValue: [] });
}
```

**Key Points:**
- Build indexes on startup (one-time cost)
- Search by index = O(1) instead of O(n)
- Prefix search for typeahead
- Category index for filtering
- A signal already only emits on an actual value change (`Object.is` equality) — `toObservable` inherits that, so there's no need for a separate `distinctUntilChanged()` here

---

### 4. Web Worker for Heavy Filtering

**Offload filtering to background thread - don't block UI!**

```typescript
// workers/filter.worker.ts
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { products, filters } = data;

  // Heavy computation in worker thread
  const filtered = products.filter((p: any) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.rating && p.rating < filters.rating) return false;
    return true;
  });

  // Send results back to main thread
  postMessage(filtered);
});
```

**Using the worker:**
```typescript
interface FilterData {
  category: string;
  minPrice: number;
  maxPrice: number;
}

@Component({
  selector: 'app-filters',
  imports: [FormField],
  template: `
    <select [formField]="filtersForm.category">
      <option value="">All</option>
      <option value="Electronics">Electronics</option>
      <option value="Clothing">Clothing</option>
    </select>

    <input [formField]="filtersForm.minPrice" type="number" placeholder="Min" />
    <input [formField]="filtersForm.maxPrice" type="number" placeholder="Max" />

    @if (filtering()) {
      <span>Filtering...</span>
    }

    <div>Results: {{ resultCount() | number }}</div>
  `
})
export class FiltersComponent {
  private readonly indexService = inject(ProductIndexService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly filtersModel = signal<FilterData>({
    category: '',
    minPrice: 0,
    maxPrice: 1000
  });
  protected readonly filtersForm = form(this.filtersModel);

  filtering = signal(false);
  resultCount = signal(0);

  private worker?: Worker;

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./workers/filter.worker', import.meta.url));

      this.worker.onmessage = ({ data }) => {
        this.filtering.set(false);
        this.resultCount.set(data.length);
        // Emit filtered results to product list component
      };

      this.destroyRef.onDestroy(() => this.worker?.terminate());
    }

    // The whole filters object is one signal, so one toObservable() replaces
    // the combineLatest([...]) of three separate FormControls
    toObservable(this.filtersModel).pipe(
      debounceTime(300),
      tap(() => this.filtering.set(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(filters => {
      this.worker?.postMessage({
        products: this.indexService.getAllProducts(), // Or subset
        filters
      });
    });
  }
}
```

**Key Points:**
- Web Worker runs in separate thread
- UI stays responsive during heavy filtering
- Transfer data between threads
- `DestroyRef.onDestroy` terminates the worker — no `ngOnDestroy` needed
- Signal Forms models the filters as one object signal, so filtering on any field is a single `toObservable()` stream instead of a three-way `combineLatest`

---

### 5. Infinite Scroll + Pagination

**Load 1M items in chunks (50 at a time):**

```typescript
@Component({
  selector: 'app-product-list'
})
export class ProductListComponent {
  private readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  private allFilteredProducts: Product[] = [];
  displayedProducts = signal<Product[]>([]);

  private currentPage = 0;
  private pageSize = 50;
  loading = signal(false);

  constructor() {
    effect(() => {
      this.viewport().scrolledIndexChange.pipe(
        throttleTime(200),
        filter(() => !this.loading()),
        filter(index => {
          const end = this.displayedProducts().length;
          return index >= end - 10; // Near bottom
        }),
        takeUntilDestroyed()
      ).subscribe(() => this.loadMore());
    });
  }

  loadMore() {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const nextPage = this.allFilteredProducts.slice(start, end);

    if (nextPage.length === 0) return; // No more data

    this.loading.set(true);

    // Simulate async loading (in real app, might be API call)
    setTimeout(() => {
      this.displayedProducts.update(current => [...current, ...nextPage]);
      this.currentPage++;
      this.loading.set(false);
    }, 100);
  }

  onFilterChange(filteredProducts: Product[]) {
    // New filter applied, reset pagination
    this.allFilteredProducts = filteredProducts;
    this.currentPage = 0;
    this.displayedProducts.set([]); // Clear
    this.loadMore(); // Load first page
  }
}
```

**Key Points:**
- Load 50 items at a time (not 1M at once)
- Virtual scroll handles rendering
- Infinite scroll loads more when near bottom
- Reset on filter change
- `viewChild.required()` replaces `@ViewChild` + the `!` definite-assignment assertion; the `effect()` in the constructor replaces `ngAfterViewInit` — it reacts once the query resolves instead of relying on a separate lifecycle hook

---

### 6. Live Performance Side Panel

**Make the optimization visible instead of only checking DevTools by hand.**

Follow the `demo-shell` side-panel layout already used elsewhere in this workspace, rather than a footer strip. Three metrics belong here, in order of how convincing they are:

**a) Rendered DOM nodes vs. total items — the metric that actually proves virtualization works**

```typescript
@Service()
export class RenderMetricsService {
  readonly renderedNodes = signal(0);

  increment(): void {
    this.renderedNodes.update(n => n + 1);
  }

  decrement(): void {
    this.renderedNodes.update(n => n - 1);
  }
}
```

```typescript
@Directive({
  selector: '[appRenderCounter]'
})
export class RenderCounter {
  private readonly metrics = inject(RenderMetricsService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.metrics.increment();
    this.destroyRef.onDestroy(() => this.metrics.decrement());
  }
}
```

Apply `appRenderCounter` to each `*cdkVirtualFor` row. With virtualization on, `renderedNodes()` stays flat (roughly viewport height ÷ item height) no matter the dataset size. With it off, watch the count climb toward the total.

**b) FPS**

```typescript
@Service()
export class FpsMonitorService {
  readonly fps = signal(0);

  private frameCount = 0;
  private lastSampleTime = performance.now();

  constructor() {
    const loop = () => {
      this.frameCount++;
      const now = performance.now();
      const elapsed = now - this.lastSampleTime;

      if (elapsed >= 1000) {
        this.fps.set(Math.round((this.frameCount * 1000) / elapsed));
        this.frameCount = 0;
        this.lastSampleTime = now;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
```

FPS is an average over the sampling window — a single long frame barely moves it. Pair it with (c) to catch what it hides.

**c) Long-task count**

```typescript
@Service()
export class LongTaskMonitorService {
  readonly longTaskCount = signal(0);

  constructor() {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver(list => {
      this.longTaskCount.update(n => n + list.getEntries().length);
    });

    observer.observe({ entryTypes: ['longtask'] });
  }
}
```

Any task blocking the main thread past 50ms counts — this is the browser-standard definition of "janky," independent of the FPS average.

**Optional — JS heap size:** `performance.memory.usedJSHeapSize` is Chrome-only and quantized for Spectre mitigations, so treat it as an approximate trend, not a precise number, if you surface it.

---

### 7. Complete Integration — with the virtualized/non-virtualized toggle

**Put it all together:**

```typescript
@Component({
  selector: 'app-dashboard',
  imports: [
    SearchComponent,
    FiltersComponent,
    ProductListComponent,
    PerformancePanel,
    ScrollingModule
  ],
  template: `
    <div class="dashboard">
      <header>
        <h1>1 Million Products</h1>
        <app-search (searchResults)="onSearch($event)" />
      </header>

      <aside>
        <app-filters (filterResults)="onFilter($event)" />
      </aside>

      <main>
        <label>
          <input type="checkbox" [checked]="virtualized()" (change)="virtualized.set(!virtualized())" />
          Virtualized rendering
        </label>

        <app-product-list [products]="currentResults()" [virtualized]="virtualized()" />
      </main>

      <aside class="performance-panel">
        <app-performance-panel
          [totalCount]="totalCount()"
          [displayedCount]="displayedCount()" />
      </aside>
    </div>
  `
})
export class DashboardComponent {
  currentResults = signal<Product[]>([]);
  totalCount = signal(1_000_000);
  displayedCount = signal(0);
  virtualized = signal(true);

  onSearch(results: Product[]) {
    this.currentResults.set(results);
    this.displayedCount.set(results.length);
  }

  onFilter(results: Product[]) {
    this.currentResults.set(results);
    this.displayedCount.set(results.length);
  }
}
```

`PerformancePanel` reads `RenderMetricsService`, `FpsMonitorService`, and `LongTaskMonitorService` via `inject()` and displays their signals directly — no polling glue needed in the dashboard itself.

**Behavior note:** rendering all 1,000,000 items with `virtualized` off will genuinely stall the tab. Either accept that as the point (the freeze itself is the proof), or cap the non-virtualized branch to a smaller subset (e.g. the first 10,000) with a label explaining why — your call, but decide deliberately rather than by accident.

---

## ✅ Acceptance Criteria

### Performance Metrics (MUST PASS)
- [ ] Initial render < 2 seconds
- [ ] Search 1M items < 500ms (with index)
- [ ] Filter 1M items < 300ms (with worker)
- [ ] Scroll at 60 FPS (no jank)
- [ ] Memory usage < 500MB
- [ ] DOM elements < 100 at any time (when virtualized)
- [ ] No UI blocking/freezing (when virtualized)

### Functionality
- [ ] Generate 1M products on startup
- [ ] Virtual scrolling works smoothly
- [ ] Search by name (debounced)
- [ ] Filter by category, price, rating
- [ ] Infinite scroll loads more
- [ ] Combine search + filters
- [ ] Display result counts
- [ ] Live performance panel shows FPS, long-task count, and rendered DOM node count in real time — not only verified via DevTools
- [ ] Toggle switches between virtualized and non-virtualized rendering for direct comparison
- [ ] Rendered DOM node count visibly stays flat while virtualized and climbs when it isn't

### Code Quality
- [ ] OnPush change detection (default — do not set it explicitly)
- [ ] TrackBy functions on loops
- [ ] Signals for state management
- [ ] Signal Forms (`form()` / `FormField`) for search and filter inputs — not `FormControl`
- [ ] `inject()` — no constructor injection
- [ ] Proper unsubscribe (`takeUntilDestroyed`, `DestroyRef.onDestroy`)
- [ ] Web Worker for heavy tasks
- [ ] Indexed search (not linear)
- [ ] No memory leaks

---

## 🧪 Performance Testing

The live panel is the first-line evidence — anyone running the app sees the numbers without opening DevTools. Use DevTools for deeper validation:

**Chrome DevTools:**
```
1. Performance Tab:
   - Record scrolling → should be 60 FPS
   - Check for long tasks (> 50ms) — cross-check against the panel's count
   - Memory profiling

2. Memory Tab:
   - Take heap snapshot
   - Check retained size
   - Look for memory leaks

3. Network Tab:
   - No network calls for search/filter (all local)
   - Only for initial data load

4. Lighthouse:
   - Performance score > 90
```

**Benchmark Script:**
```typescript
function benchmark() {
  console.time('Generate 1M products');
  const products = generateProducts(1_000_000);
  console.timeEnd('Generate 1M products');

  console.time('Build indexes');
  buildIndexes(products);
  console.timeEnd('Build indexes');

  console.time('Search');
  const results = search('Product 12345');
  console.timeEnd('Search');

  console.time('Filter');
  const filtered = filter({ category: 'Electronics', minPrice: 100 });
  console.timeEnd('Filter');

  console.log('Results:', results.length);
  console.log('Filtered:', filtered.length);
}
```

**Expected Results:**
- Generate 1M: ~500ms
- Build indexes: ~2-3s
- Search: < 10ms
- Filter: < 100ms (with worker)

---

## 📚 Resources

**Virtual Scrolling:**
- [Angular CDK Scrolling](https://material.angular.io/cdk/scrolling/overview)
- [Virtual Scrolling Guide](https://blog.angular-university.io/angular-cdk-virtual-scroll/)

**Web Workers:**
- [Angular Web Workers](https://angular.dev/ecosystem/web-workers)
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

**Performance:**
- [Angular Performance Guide](https://angular.dev/best-practices/performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [PerformanceLongTaskTiming (Long Tasks API) — MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming)
- [PerformanceObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)

---

## 💡 Optimization Checklist

- [ ] Virtual scrolling with fixed item size
- [ ] OnPush change detection everywhere (default, don't set explicitly)
- [ ] TrackBy on all loops
- [ ] Debounce user inputs (300ms)
- [ ] Throttle scroll events (200ms)
- [ ] Index-based search (not linear)
- [ ] Web Workers for heavy filtering
- [ ] Pagination (load in chunks)
- [ ] Signals for reactive state
- [ ] Immutable updates (no array.push)
- [ ] Lazy load heavy components (defer)
- [ ] Profile with Chrome DevTools
- [ ] Monitor memory usage
- [ ] Use production build for testing
- [ ] Live FPS / long-task / DOM-count panel, not just DevTools

---

## 🚀 Getting Started

1. Create Angular app with CDK
2. Generate 1M products (in service)
3. Build search indexes
4. Implement virtual scrolling
5. Add debounced search
6. Add filters with Web Worker
7. Add infinite scroll
8. Build the live performance panel (FPS, long tasks, rendered DOM count)
9. Add the virtualized/non-virtualized toggle
10. Optimize with OnPush + trackBy
11. Measure performance
12. Optimize until metrics pass

---

**This is the REAL performance challenge. If you can make 1M items work smoothly, you can handle anything!**
