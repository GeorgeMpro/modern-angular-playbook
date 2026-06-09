import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';

import {finalize, partition, share, take} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

import {gatherArray} from '../shared/operators/operators';
import {MockApiService} from '../mock/mock-api.service';
import {AppEventTable} from '../shared/components/event-table/app-event-table';
import {TableAction} from '../shared/models/table.model';
import {AppEvent} from '../shared/models/event.model';


const STREAM_LIMIT = 200;

@Component({
  selector: 'app-stream-splitter',
  imports: [
    AppEventTable
  ],
  templateUrl: './stream-splitter.html',
  styleUrl: './stream-splitter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class StreamSplitter {

  private readonly service = inject(MockApiService);

  protected readonly isComplete = signal(false);
  private readonly dismissedIds = signal<number[]>([]);

  protected readonly dismiss: TableAction<AppEvent> = {
    label: 'dismiss',
    callback: (event: AppEvent) => this.dismissCriticalEvent(event),
  };

  // Notice: the partition operator DOES NOT multicast
  private readonly stream$ = this.service.getEventStream()
    .pipe(
      take(STREAM_LIMIT),
      finalize(() => {
        this.isComplete.set(true);
      }),
      share(),
    );
  private readonly partitions$ = partition(this.stream$, value => value.type !== 'error');
  private readonly normal$ = this.partitions$[0]
    .pipe(gatherArray());
  private readonly critical$ = this.partitions$[1]
    .pipe(gatherArray());

  protected readonly normal = toSignal(this.normal$, {
    initialValue: []
  });
  protected readonly critical = toSignal(this.critical$, {
    initialValue: []
  });
  protected readonly criticalDisplay = computed(() => {
    const dismissedSet = new Set(this.dismissedIds());
    return this.critical().filter(event => !dismissedSet.has(event.timestamp));
  });

  private dismissCriticalEvent(event: AppEvent): void {
    this.dismissedIds.update(curr => [...curr, event.timestamp]);
  }
}
