import {Component, Signal, ChangeDetectionStrategy} from '@angular/core';
import {interval, Observable} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-ticker',
  imports: [],
  templateUrl: './ticker.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './ticker.scss',
})
export class Ticker {
  readonly counterObservable: Observable<number> = interval(1000);

  readonly counter: Signal<number> = toSignal(this.counterObservable, {initialValue: 0});
}
