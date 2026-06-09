import {ChangeDetectionStrategy, Component, DestroyRef, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {catchError, finalize, map, of, tap,} from 'rxjs';
import {takeUntilDestroyed,} from '@angular/core/rxjs-interop';

import {DemoShell} from '../demo-shell/demo-shell';
import {InfiniteScroll} from '../../directives/infinite-scroll';

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

const BASE_URL = 'https://dummyjson.com/products'

@Component({
  selector: 'app-infinite-scroll-demo',
  imports: [
    DemoShell,
    InfiniteScroll
  ],
  templateUrl: './infinite-scroll-demo.component.html',
  styleUrl: './infinite-scroll-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfiniteScrollDemo {
  private readonly stepsize: number = 5;

  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);

  protected readonly products = signal<Product[]>([]);
  protected readonly error = signal<string>('');
  private readonly productLimit = signal<number>(30);
  private readonly isLoading = signal<boolean>(false);

  protected onScrollEnd() {
    let isInBounds = this.products().length < this.productLimit();
    if (isInBounds && !this.isLoading()) {
      this.isLoading.set(true);
      const url = `${BASE_URL}?limit=${this.stepsize}&skip=${this.products().length}`;
      this.http.get<ProductResponse>(url)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(res => this.productLimit.set(res.total)),
          map(res => res.products),
          catchError(() => {
            this.error.set('Could not load products. Please try again later.')
            return of([]);
          }),
          finalize(() => this.isLoading.set(false))
        ).subscribe(
        value => {
          this.products.update(v => {
            return [...v, ...value]
          })
        }
      );
    }
  }
}
