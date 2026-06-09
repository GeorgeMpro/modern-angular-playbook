import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {map, mergeScan, shareReplay, catchError, merge, Observable, of, scan, Subject} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

import {Product, ProductReply, SaveResult} from '../shared/models/products.model';
import {Item, MockApiService} from '../mock/mock-api.service';
import {APP_CONFIG} from '../shared/tokens/config.tokens';

@Component({
  selector: 'app-async-state-accumulator',
  imports: [],
  templateUrl: './async-state-accumulator.html',
  styleUrl: './async-state-accumulator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class AsyncStateAccumulator {

  private readonly config = inject(APP_CONFIG);
  private readonly baseUrl = this.config.productsApiUrl;

  private readonly http = inject(HttpClient);
  private readonly service = inject(MockApiService);

  private readonly products$: Observable<Product[]> = this.http.get<ProductReply>(this.baseUrl)
    .pipe(
      map(reply => reply.products)
    );
  protected readonly products = toSignal(this.products$, {
    initialValue: []
  });

  private readonly productIndex = signal(0);

  private readonly productStream$ = new Subject<Product>();
  private readonly savedItems$ = this.productStream$.pipe(
    mergeScan<Product, SaveResult[]>((acc, curr) => {
      const item = {id: curr.id, name: curr.title, category: 'warning' as const};
      return this.handleSaveItem(item, acc);
    }, [], 1),
    shareReplay({bufferSize: 1, refCount: true})
  );
  private readonly saveCounter$ = merge(
    this.productStream$.pipe(map(() => 1)),
    this.savedItems$.pipe(map(() => -1))
  ).pipe(
    scan((acc, val) => acc + val, 0)
  );

  protected readonly savedItems = toSignal(this.savedItems$, {initialValue: []});

  protected readonly saveCounter = toSignal(this.saveCounter$, {
    initialValue: 0
  });

  protected onClick() {
    if (this.productIndex() < this.products().length) {
      this.productStream$.next(this.products()[this.productIndex()]);
      this.productIndex.update(curr => curr + 1);
    }
  }

  private handleSaveItem(item: Item, acc: SaveResult[]) {
    return this.service.saveItem(item).pipe(
      map(result => [...acc, result]),
      catchError(() => {
        console.warn(`Failed to save item #${item.id}`);

        return of(acc);
      })
    );
  }
}
