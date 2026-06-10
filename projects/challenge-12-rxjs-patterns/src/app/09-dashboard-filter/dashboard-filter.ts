import {Component, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  Observable,
  of,
  startWith,
  switchMap
} from 'rxjs';

import {withLoading} from '../shared/operators/operators';
import {Product, ProductReply} from '../shared/models/products.model';
import {ProductTable} from '../shared/components/product-table/product-table';

let delay = 500;
@Component({
  selector: 'app-dashboard-filter',
  templateUrl: './dashboard-filter.html',
  styleUrl: './dashboard-filter.scss',
  imports: [
    ProductTable
  ],
  standalone: true
})
export default class DashboardFilter {
  private readonly categoryApi = 'https://dummyjson.com/products/category-list';
  private readonly baseApi = 'https://dummyjson.com/products/';
  private readonly errorMsg = 'Could not load categories. Please try again later.';

  private readonly http = inject(HttpClient);

  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);
  protected readonly chosenCategory = signal('');
  protected readonly query = signal('');

  private readonly categories$ = this.http.get<String[]>(this.categoryApi)
    .pipe(
      withLoading(this.isLoading),
      catchError(err => {
        console.error(err);
        this.errorMessage.set(this.errorMsg)
        return EMPTY;
      })
    );

  protected readonly categories = toSignal(this.categories$, {initialValue: []});
  private readonly chosenCategory$ = toObservable(this.chosenCategory);

  private readonly query$ = toObservable(this.query).pipe(
    debounceTime(delay),
    distinctUntilChanged(),
  );
  private readonly combined$ = combineLatest({
    query: this.query$,
    category: this.chosenCategory$
  }).pipe(
    filter(({query, category}) => query !== '' || category !== ''),
    switchMap(({query, category}) => {
      const isSearching = query !== '' || category !== '';
      if (!isSearching) {
        return of({data: [], loading: false, active: false});
      }

      return this.handleSearch(query, category)
        .pipe(
          map(products => ({data: products, loading: false, active: true})),
          startWith({data: [], loading: true, active: true}),
          catchError(() => of({data: [], loading: false, active: true}))
        );
    }),
    startWith({data: [], loading: false, active: false}),
  );

  private handleSearch(query: string, category: string) {
    const isQuery = query && category === '';
    const isCategory = query === '' && category;
    if (isQuery) {
      return this.getProductsByQuery(query);
    } else {
      if (isCategory) {
        return this.getProductsByCategory(category);
      }
    }
    return this.filterProductsCategoryByQuery(query, category);
  }

  private getProductsByQuery(query: string): Observable<Product[]> {
    return this.getProducts(`${this.baseApi}search?q=${query}`)
  }

  private getProductsByCategory(category: string): Observable<Product[]> {
    return this.getProducts(`${this.baseApi}category/${category}`)
  }

  private filterProductsCategoryByQuery(query: string, category: string) {
    return this.getProductsByCategory(category).pipe(
      map(products => {
        return products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
      })
    );
  }

  private getProducts(api: string): Observable<Product[]> {
    return this.http.get<ProductReply>(api).pipe(
      map(val => val.products)
    );
  }

  protected readonly products = toSignal(this.combined$, {
    initialValue: {data: [], loading: false, active: false}
  });

  onCategoryChange(category: string): void {
    this.chosenCategory.set(category);
  }

  onQuery(query: string) {
    this.query.set(query);
  }
}
/*
## Challenge 9: The Dashboard Filter

**Operators:** `combineLatest`, `withLatestFrom`, `switchMap`, `debounce`
**Data source:** dummyjson — `/products/search?q=` and `/products/category/{category}`

### The Problem

A product table with two independent controls: a category dropdown and a search text input. The table must re-query the API whenever **either** changes. Neither control should block the other.

### Task

Create two signals — one for the selected category, one for the search text. Bridge both into observables and combine them into a single derived stream that fires an HTTP request whenever either value changes.

### Behavior

- Changing the category immediately re-queries (no debounce needed)
- Changing the search text debounces before re-querying
- Both controls can change independently — neither waits for the other
- The active request is cancelled if either control changes while a request is in flight
- Loading state is shown while the request is in flight

### What you'll learn

`combineLatest([a$, b$])` emits whenever **either** source emits, using the latest value from the other. It requires all sources to have emitted at least once before it fires — use `startWith` or signal initial values to avoid this trap.

`withLatestFrom(b$)` is different: it only emits when the **primary** source emits, sampling the latest value of `b$` at that moment. Use it when one stream drives the query and the other is just context.

### Hint

Think carefully about which operator fits here. If the category changes, you want to re-query — that makes category a primary source. If search text changes, you also want to re-query — that also makes it a primary source. When both are primary, `combineLatest` is the right tool. If only one were primary, `withLatestFrom` would apply.

---*/
