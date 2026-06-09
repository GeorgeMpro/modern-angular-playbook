import {Component, signal, ChangeDetectionStrategy, inject, computed} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {HttpClient} from '@angular/common/http';

import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {switchMap, map, tap, of, Observable, timer, debounce, catchError} from 'rxjs';

import {withLoading} from '../shared/operators/operators';
import {Product, ProductReply} from '../shared/models/products.model';
import {ProductTable} from '../shared/components/product-table/product-table';
import {APP_CONFIG} from '../shared/tokens/config.tokens';


interface SearchData {
  query: string
}

const DELAY = 400;

@Component({
  selector: 'app-signal-bridge',
  imports: [
    FormField,
    ProductTable
  ],
  templateUrl: './signal-bridge.html',
  styleUrl: './signal-bridge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignalBridge {

  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);

  protected readonly isLoading = signal(false);
  private readonly searchModel = signal<SearchData>({
    query: ''
  });

  protected readonly searchForm = form(this.searchModel);
  protected readonly hasSearchTerm = computed(() => {
    return this.searchForm.query().value().length > 0;
  });

  private readonly query$ = toObservable(this.searchForm.query().value)
    .pipe(
      tap(query => this.isLoading.set(query.length > 0)),
      debounce((query: string) => {
        return query.length > 0 ? timer(DELAY) :
          of(null)
      }),
    );
  private readonly results$ = this.query$.pipe(
    switchMap(query => this.handleQuery(query)),
  );

  protected readonly products = toSignal(this.results$, {initialValue: []});

  private searchProduct(query: string) {
    return this.http.get<ProductReply>(`${this.config.productsApiUrl}/search?q=${query}`)
      .pipe(
        map(reply => reply.products)
      );
  }

  private handleQuery(query: string): Observable<Product[]> {
    if (!query) return of([]);

    return this.searchProduct(query).pipe(
      withLoading(this.isLoading),
      catchError(err => {
        console.error(`An error has occurred`, err);
        return of([]);
      }),
    );
  }
}
