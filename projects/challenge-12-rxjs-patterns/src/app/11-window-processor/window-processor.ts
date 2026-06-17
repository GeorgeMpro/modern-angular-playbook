import {Component, inject} from '@angular/core';
import {DatePipe, TitleCasePipe} from '@angular/common';

import {toSignal} from '@angular/core/rxjs-interop';
import {filter, reduce, scan, windowTime, mergeMap, map} from 'rxjs';

import {MockApiService} from '../mock/mock-api.service';

export interface WindowSnapshot {
  errorsPerWindow: number;
  date: Date;
}

@Component({
  selector: 'app-window-processor',
  imports: [
    TitleCasePipe,
    DatePipe
  ],
  templateUrl: './window-processor.html',
  styleUrl: './window-processor.scss',
  standalone: true
})
export default class WindowProcessor {

  private readonly windowSpan = 1000;
  private readonly windowSize = 10;
  protected readonly title = 'errors per window';

  private readonly service = inject(MockApiService);

  private readonly eventStream = this.service.getEventStream();
  private readonly windowAnalytics$ = this.eventStream.pipe(
    windowTime(this.windowSpan),
    mergeMap(window$ => window$.pipe(
      filter(event => event.type === 'error'),
      reduce((acc) => acc + 1, 0),
    )),
    map((val): WindowSnapshot => ({errorsPerWindow: val, date: new Date()})),
    scan((acc: WindowSnapshot[], curr: WindowSnapshot) => [...acc, curr].slice(
      -this.windowSize
    ), []),
  );

  protected readonly windowHistory = toSignal(this.windowAnalytics$, {initialValue: []})
}
