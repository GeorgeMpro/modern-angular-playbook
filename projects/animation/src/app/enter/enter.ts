import {Component, signal, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-enter',
  imports: [],
  templateUrl: './enter.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './enter.scss',
})
export class Enter {
  readonly isShown = signal(false);

  toggle() {
    this.isShown.update((isShown) => !isShown);
  }
}
