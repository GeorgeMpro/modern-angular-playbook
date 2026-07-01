import {Component, signal, ChangeDetectionStrategy} from '@angular/core';
import {DebounceClick} from '../shared/directives/debounce-click';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';

@Component({
  selector: 'app-debounce-click-demo',
  imports: [
    DebounceClick,
    DemoShell
  ],
  templateUrl: './debounce-click-demo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './debounce-click-demo.scss',
})
export default class DebounceClickDemo {
  protected readonly customDelay: number = 500;

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
