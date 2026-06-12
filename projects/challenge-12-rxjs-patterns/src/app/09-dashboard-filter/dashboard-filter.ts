import {Component, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  of,
  startWith,
  switchMap, tap
} from 'rxjs';

import {withLoading} from '../shared/operators/operators';
import {Product, ProductReply} from '../shared/models/products.model';
import {ProductTable} from '../shared/components/product-table/product-table';

interface SearchState {
  data: Product[];
  loading: boolean;
  active: boolean;
}

interface CategoryCache {
  category: string;
  data: Product[];
}

const INITIAL_STATE: SearchState = {data: [], loading: false, active: false}


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
  private readonly delay = 500;
  private readonly categoryApi = 'https://dummyjson.com/products/category-list';
  private readonly baseApi = 'https://dummyjson.com/products/';
  private readonly errorMsg = 'Could not load categories. Please try again later.';

  private readonly http = inject(HttpClient);

  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);
  protected readonly chosenCategory = signal('');
  protected readonly query = signal('');
  private readonly categoryDataCache = signal<CategoryCache>({category: '', data: []});

  private readonly categories$ = this.http.get<string[]>(this.categoryApi)
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
    debounceTime(this.delay),
    distinctUntilChanged(),
  );
  private readonly combined$ = combineLatest({
    query: this.query$,
    category: this.chosenCategory$
  }).pipe(
    switchMap(({query, category}) => {
      return this.performSearch(query, category);
    }),
    startWith({data: [], loading: false, active: false}),
  );

  protected readonly products = toSignal(this.combined$, {
    initialValue: INITIAL_STATE
  });


  private performSearch(query: string, category: string) {
    const isSearching = query !== '' || category !== '';
    if (!isSearching) {
      return of(INITIAL_STATE);
    }

    return this.buildSearchState(query, category);
  }

  private buildSearchState(query: string, category: string) {
    return this.handleSearch(query, category)
      .pipe(
        map(products => ({data: products, loading: false, active: true})),
        startWith({data: [], loading: true, active: true}),
        catchError(() => of({data: [], loading: false, active: true}))
      );
  }

  private handleSearch(query: string, category: string) {
    if (query && !category)
      return this.getProductsByQuery(query);

    if (!query && category)
      return this.getProductsByCategory(category);

    return this.filterProductsCategoryByQuery(query, category);
  }

  private getProductsByQuery(query: string): Observable<Product[]> {
    return this.getProducts(`${this.baseApi}search?q=${query}`)
  }

  private getProductsByCategory(category: string): Observable<Product[]> {
    return this.getProducts(`${this.baseApi}category/${category}`)
  }

  private filterProductsCategoryByQuery(query: string, category: string): Observable<Product[]> {
    return this.getData(category).pipe(
      map(products => this.filterProducts(query, products))
    );
  }

  private getData(category: string): Observable<Product[]> {
    if (this.categoryDataCache().category === category) {
      return of(this.categoryDataCache().data);
    }
    return this.getProductsByCategory(category).pipe(
      tap(products => this.categoryDataCache.set({category, data: products}))
    );
  }

  private filterProducts(query: string, products: Product[]): Product[] {
    return products.filter(
      p => p.title.toLowerCase().includes(query.toLowerCase())
    )
  }

  private getProducts(api: string): Observable<Product[]> {
    return this.http.get<ProductReply>(api).pipe(
      map(val => val.products)
    );
  }


  protected onCategoryChange(category: string): void {
    this.chosenCategory.set(category);
  }

  protected onQuery(query: string) {
    this.query.set(query);
  }
}
