import {Component, DestroyRef, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {
  BehaviorSubject,
  catchError,
  concatMap,
  EMPTY,
  map,
  Observable,
  Subject,
  tap,
} from 'rxjs';
import {takeUntilDestroyed, toSignal,} from '@angular/core/rxjs-interop';

import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {InfiniteScroll} from '../shared/directives/infinite-scroll';
import {NgTemplateOutlet} from '@angular/common';
import {withLoading} from '../shared/operators/rxjs-operators';

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
}

interface ProductResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

interface ProductState {
  products: Product[];
  totalItems: number;
  skip: number
}

const BASE_URL = 'https://dummyjson.com/products';

const INITIAL_STATE: ProductState = {products: [], totalItems: Infinity, skip: 0};


@Component({
  selector: 'app-infinite-scroll-demo',
  imports: [
    DemoShell,
    InfiniteScroll,
    NgTemplateOutlet
  ],
  templateUrl: './infinite-scroll-demo.component.html',
  styleUrl: './infinite-scroll-demo.component.scss',
})
export default class InfiniteScrollDemo {
  private readonly stepSize: number = 15;

  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly error = signal<string>('');
  protected readonly isLoading = signal<boolean>(false);

  private readonly state$ = new BehaviorSubject<ProductState>(INITIAL_STATE);
  private readonly scrollEnd$ = new Subject<void>();
  private readonly handleScroll$ = this.scrollEnd$.pipe(
    concatMap(() => {
      const {skip} = this.state$.value;
      const url = `${BASE_URL}?limit=${this.stepSize}&skip=${skip}`;
      return this.buildProductState(url)
    }),
    tap(state => this.state$.next(state))
  );

  protected readonly productState = toSignal(this.handleScroll$, {
    initialValue: INITIAL_STATE
  });

  private buildProductState(url: string): Observable<ProductState> {
    return this.http.get<ProductResponse>(url)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLoading(this.isLoading),
        map((res): ProductState => ({
          products: [...this.state$.value.products, ...res.products],
          totalItems: res.total,
          skip: this.state$.value.skip + res.products.length
        })),
        catchError(() => {
          this.error.set('Could not load products. Please try again later.')
          return EMPTY;
        }),
      );
  }

  protected onScrollEnd() {
    const {products, totalItems} = this.productState();
    const isInBounds = products.length < totalItems;

    if (isInBounds && !this.isLoading()) {
      this.scrollEnd$.next();
    }
  }
}
