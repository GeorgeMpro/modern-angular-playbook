import {Directive, input} from '@angular/core';
import {debounce, debounceTime, Subject, timer} from 'rxjs';
import {outputFromObservable} from '@angular/core/rxjs-interop';

@Directive({
  selector: '[appDebounceClick]',
  host: {
    '(click)': 'onClick()'
  }
})
export class DebounceClick {
  readonly timeDelay = input<number>(300);
  private readonly clickListener$ = new Subject<void>();
  private readonly clickDelay$ = this.clickListener$.pipe(
    debounce(() => timer(this.timeDelay()))
  );
  protected readonly btnClick = outputFromObservable<void>(this.clickDelay$);


  onClick(): void {
    this.clickListener$.next();
  }
}
