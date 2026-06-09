import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {toSignal} from '@angular/core/rxjs-interop';
import {map, auditTime, bufferTime, catchError, EMPTY, filter, scan, share, take} from 'rxjs';

import {AppEventTable} from '../shared/components/event-table/app-event-table';
import {MockApiService} from '../mock/mock-api.service';

const SPAN = 500;
const MOCK_LIMIT = 500;

@Component({
  selector: 'app-high-pressure-smoother',
  imports: [
    AppEventTable
  ],
  templateUrl: './high-pressure-smoother.html',
  styleUrl: './high-pressure-smoother.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class HighPressureSmoother {

  private readonly service = inject(MockApiService);
  private readonly items$ = this.service.getEventStream()
    .pipe(
      take(MOCK_LIMIT),
      catchError((err) => {
        console.error(`An error has occurred`, err);
        return EMPTY;
      }),
      share(),
    );
  private readonly batch$ = this.items$.pipe(
    bufferTime(SPAN),
    filter(batch => batch.length > 0),
    share()
  );
  private readonly latestItem$ = this.items$.pipe(
    auditTime(SPAN)
  );
  private readonly rollingBatchCount$ = this.batch$.pipe(
    map(batch => batch.length),
    scan((acc, curr) => {
      return acc + curr;
    }, 0)
  );

  protected readonly items = toSignal(this.batch$, {initialValue: []});
  protected readonly latestItem = toSignal(this.latestItem$,
    {initialValue: null});
  protected readonly rollingBatchCount = toSignal(this.rollingBatchCount$, {initialValue: 0});
}
