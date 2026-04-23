import {Component, inject} from '@angular/core';

import {DemoShell} from '../demo-shell/demo-shell';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
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

const URL = 'https://dummyjson.com/products?limit=5'

// const URL = 'https://dummyjson.com/products'

@Component({
  selector: 'app-infinte-scroll-demo',
  imports: [
    DemoShell,
    InfiniteScroll
  ],
  templateUrl: './infinite-scroll-demo.component.html',
  styleUrl: './infinite-scroll-demo.component.scss',
})
export class InfiniteScrollDemo {
  private readonly http = inject(HttpClient);

  private readonly products$: Observable<Product[]> = this.http.get<ProductResponse>(URL)
    .pipe(map(res => res.products))

  protected readonly products = toSignal(this.products$, {
    initialValue: []
  })

  protected onScrollEnd() {

  }
}

/*

● 1. Replace toSignal with a plain signal<Product[]>([]) — you're building
  the list incrementally, not from a single observable
  2. Add state signals — skip, total, loading
  3. Write a loadMore() method — fetches ?limit=5&skip=${skip()}, appends
  results to the products signal, updates skip and total
  4. Call loadMore() on init — so the first batch loads automatically
  5. Guard with loading — if a request is in flight, loadMore() returns early
  6. Stop when exhausted — if skip() >= total(), loadMore() returns early
  7. Wire (scrollEnd) to loadMore() in the template
*/
