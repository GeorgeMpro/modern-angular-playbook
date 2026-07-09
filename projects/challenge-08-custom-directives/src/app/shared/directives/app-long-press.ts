import {DestroyRef, Directive, ElementRef, inject, input, output} from '@angular/core';

import {fromEvent, merge, switchMap, takeUntil, tap, timer} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Directive({
  selector: '[appLongPress]',
})
export class AppLongPress {

  private readonly el = inject(ElementRef);
  private readonly hostEl = this.el.nativeElement;

  readonly threshold = input<number>(500);
  readonly longPress = output<void>();

  private readonly mousePress$ = fromEvent(this.hostEl, 'mousedown');
  private readonly touchStart$ = fromEvent(this.hostEl, 'touchstart');
  private readonly press$ = merge(this.mousePress$, this.touchStart$);

  private readonly mouseRelease$ = fromEvent(this.hostEl, 'mouseup');
  private readonly touchRelease$ = fromEvent(this.hostEl, 'touchend');
  private readonly release$ = merge(this.mouseRelease$, this.touchRelease$);

  private readonly mouseLeave$ = fromEvent(this.hostEl, 'mouseleave');
  private readonly touchCancel$ = fromEvent(this.hostEl, 'touchcancel');
  private readonly cancel$ = merge(this.release$, this.mouseLeave$, this.touchCancel$);

  private readonly held$ = this.press$.pipe(
    switchMap(() => this.handlePress())
  );

  constructor() {
    this.held$.pipe(takeUntilDestroyed())
      .subscribe();
  }

  private handlePress() {
    return timer(this.threshold()).pipe(
      takeUntil(this.cancel$),
      tap(() => {
        this.longPress.emit();
      })
    )
  }
}
