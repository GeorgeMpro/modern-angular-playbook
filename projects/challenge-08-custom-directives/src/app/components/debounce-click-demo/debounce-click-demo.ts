import {Component, signal} from '@angular/core';
import {DebounceClick} from '../../directives/debounce-click';

@Component({
  selector: 'app-debounce-click-demo',
  imports: [
    DebounceClick
  ],
  templateUrl: './debounce-click-demo.html',
  styleUrl: './debounce-click-demo.scss',
})
export class DebounceClickDemo {
  protected readonly clickCount = signal<number>(0);
  protected readonly log = signal<string[]>([]);

  protected onDebounceClick(): void {
    this.clickCount.update(v => v + 1);
    this.debounceLog();
  }

  protected debounceLog() {
    this.log.update(l => [`Action triggered at ${new Date().toLocaleTimeString()}`, ...l].slice(0, 5));
  }
}
