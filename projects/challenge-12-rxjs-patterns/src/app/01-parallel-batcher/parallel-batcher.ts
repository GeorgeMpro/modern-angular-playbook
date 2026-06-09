import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  from,
  Observable,
  of,
  switchMap,
  toArray,
  mergeMap
} from 'rxjs';

import {withLoading} from '../shared/operators/operators';
import {CATEGORY_COLORS} from '../shared/models/event.model';
import {Item, MockApiService} from '../mock/mock-api.service';

@Component({
  selector: 'app-parallel-batcher',
  templateUrl: './parallel-batcher.html',
  styleUrl: './parallel-batcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class ParallelBatcher {

  private readonly concurrent = 3;

  private readonly service = inject(MockApiService);

  protected readonly isLoading = signal(false);

  private readonly ids$ = this.service.getItemIds();
  private readonly items$ = this.ids$
    .pipe(
      switchMap(ids => from(ids)),
      mergeMap(id => this.resolveItemDetail(id),
        this.concurrent),
      toArray(),
      withLoading(this.isLoading),
      catchError((err) => this.resolveError(err))
    );

  private resolveItemDetail(id: number): Observable<Item> {
    return this.service.getItemDetail(id)
      .pipe(
        catchError(() => {
          return of(this.createSentinelItem(id))
        }))
  }

  private createSentinelItem(id: number): Item {
    return {
      id,
      name: 'Error loading item',
      category: 'error'
    }
  }

  private resolveError(error: unknown): Observable<never> {
    console.error(error);
    return EMPTY;
  }

  protected readonly items = toSignal(this.items$, {
    initialValue: []
  });

  protected readonly sortedItems = computed(() => {
    const items = [...this.items()];
    return items.sort((a, b) => a.id - b.id);
  });
  protected readonly CATEGORY_COLORS = CATEGORY_COLORS;
}
