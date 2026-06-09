import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {toSignal} from '@angular/core/rxjs-interop';
import {mergeMap, catchError, EMPTY, expand, takeWhile, toArray} from 'rxjs';

import {withLoading} from '../shared/operators/operators';
import {ProductReply} from '../shared/models/products.model';
import {ProductTable} from '../shared/components/product-table/product-table';
import {APP_CONFIG} from '../shared/tokens/config.tokens';


@Component({
  selector: 'app-recursive-crawler',
  imports: [
    ProductTable
  ],
  templateUrl: './recursive-crawler.html',
  styleUrl: './recursive-crawler.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class RecursiveCrawler {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly stepSize = 10;
  private readonly baseUrl = `${this.config.productsApiUrl}?limit=${this.stepSize}`;

  protected readonly isLoading = signal(false);
  private readonly products$ = this.http.get<ProductReply>(this.baseUrl)
    .pipe(
      expand(res => {
        const step = res.skip + this.stepSize;
        return this.fetchProducts(step);
      }),
      // Notice: one "zombie request" to do the challenge with takeWhile
      takeWhile(
        res => this.isInBounds(res.total, res.skip + this.stepSize),
        true),
      mergeMap(res => res.products),
      toArray(),
      withLoading(this.isLoading),
      catchError(err => {
        console.error(err);
        return EMPTY;
      })
    );

  protected readonly products = toSignal(this.products$,
    {initialValue: []});

  protected readonly pages = computed<number>(() => {
    return Math.ceil(this.products().length / this.stepSize);
  });

  private fetchProducts(step: number) {
    return this.http.get<ProductReply>(this.generateUrl(step))
      .pipe(
        catchError(err => {
            console.error(`Could not fetch items on page ${step}`, err);
            return EMPTY;
          }
        )
      );
  }

  private generateUrl(skip: number): string {
    return `${this.baseUrl}&skip=${skip}`
  }

  private isInBounds(total: number, current: number): boolean {
    return total > current;
  }
}
