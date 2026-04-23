import {afterNextRender, Directive, ElementRef, inject, input, output} from '@angular/core';

import {outputFromObservable} from '@angular/core/rxjs-interop';
import {asyncScheduler, filter, Subject, throttleTime} from 'rxjs';

const DELAY_DURATION = 100;

@Directive({
  selector: '[appInfiniteScroll]',
  host: {
    '(scroll)': 'scroll$.next()'
  }
})
export class InfiniteScroll {
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly scrollThreshold = input<number>(0.8);

  protected readonly scroll$ = new Subject<void>();
  private readonly scrollEnd$ = this.scroll$.pipe(
    throttleTime(DELAY_DURATION, asyncScheduler, {
      leading: true, trailing: true
    }),
    filter(() => {
      const {scrollTop, clientHeight, scrollHeight} = this.el.nativeElement;

      return scrollTop + clientHeight >= scrollHeight * this.scrollThreshold();
    })
  );

  public scrollEnd = outputFromObservable<void>(this.scrollEnd$);

  constructor() {
    // Trigger threshold check on init — catches containers already at 80% before any scroll
    afterNextRender(() => this.scroll$.next());
  }
}
