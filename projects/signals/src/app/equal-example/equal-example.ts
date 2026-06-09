import {Component, ChangeDetectionStrategy} from '@angular/core';
import {interval, map} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-equal-example',
  imports: [],
  templateUrl: './equal-example.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './equal-example.scss',
})
export class EqualExample {
  temperature$ = interval(1000).pipe(
    map(() => ({temperature: Math.floor(Math.random() * 3) + 20})),
  );

  temperature = toSignal(this.temperature$, {
    equal: (prev, curr) => prev?.temperature === curr?.temperature
  });


}
