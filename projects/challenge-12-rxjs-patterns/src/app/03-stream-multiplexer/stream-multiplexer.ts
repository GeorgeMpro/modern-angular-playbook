import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';

import {takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  bufferTime,
  catchError,
  EMPTY,
  filter,
  groupBy,
  GroupedObservable,
  ObservableInput,
  of,
  scan,
  tap,
  mergeMap,
  take
} from 'rxjs';

import {MockApiService} from '../mock/mock-api.service';
import {AppEvent, ErrorState, EventType, Status, STATUS_COLORS} from '../shared/models/event.model';
import {KeyValuePipe, TitleCasePipe} from '@angular/common';


const EVENT_LIMIT = 150;

@Component({
  selector: 'app-stream-multiplexer',
  imports: [
    KeyValuePipe,
    TitleCasePipe
  ],
  templateUrl: './stream-multiplexer.html',
  styleUrl: './stream-multiplexer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class StreamMultiplexer {

  private readonly streamHandler: Record<EventType, (groups$: GroupedObservable<EventType, AppEvent>) => ObservableInput<unknown>> = {
    log: this.handleLog(),
    warning: this.handleWarning(),
    error: this.handleError(),
  };

  private readonly service = inject(MockApiService);
  private readonly mainStream$ = this.service.getEventStream();
  private readonly stream$ = this.mainStream$.pipe(
    groupBy(item => item.type),
    mergeMap(group$ => {
      return this.streamHandler[group$.key](group$);
    }),

    // Kill switch
    take(EVENT_LIMIT)
  );

  protected readonly logCount = signal(0);
  protected readonly errors = signal<ErrorState[]>([]);
  protected readonly warnings = signal<AppEvent[]>([]);

  constructor() {
    this.stream$.pipe(
      takeUntilDestroyed()
    ).subscribe();
  }

  private handleLog() {
    return (event: GroupedObservable<EventType, AppEvent>) => event.pipe(
      scan(acc => acc + 1, 0),
      tap(val => this.logCount.set(val))
    );
  }

  private handleWarning(timeSpan: number = 5000, maxBufferSize: number = 3) {
    return (event: GroupedObservable<EventType, AppEvent>) => event.pipe(
      bufferTime(timeSpan, null, maxBufferSize),
      filter(events => events.length > 0),
      mergeMap(events => {
        this.warnings.update(curr => {
          return [...curr, ...events]
        })
        return of(events);
      }));
  }

  private handleError() {
    return (event: GroupedObservable<EventType, AppEvent>) => event.pipe(
      mergeMap(item => {
          this.saveErrorState(item, 'pending');
          return this.handleSaveItem(item)
        }
      ));
  }

  private handleSaveItem(item: AppEvent) {
    return this.service.saveItem({
      id: item.timestamp,
      name: item.message,
      category: 'error'
    }).pipe(
      tap({
        next: () => this.saveErrorState(item, 'success')
      }),
      catchError(err => {
        console.error(err);
        this.saveErrorState(item, 'error');
        return EMPTY;
      })
    );
  }

  private saveErrorState(item: AppEvent, status: Status): void {
    this.errors.update(curr => {
      const index = curr.findIndex(errorState => errorState.event.timestamp === item.timestamp);
      if (index === -1) {
        return [...curr, {event: item, status}];
      }

      return curr.map((e, i) => i === index ?
        {...e, status} : e);
    });
  }

  protected readonly STATUS_COLORS = STATUS_COLORS;
}
