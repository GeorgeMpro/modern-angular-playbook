import {Component, computed, signal} from '@angular/core';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppLongPress} from '../shared/directives/app-long-press';

@Component({
  selector: 'app-long-press',
  imports: [
    DemoShell,
    AppLongPress
  ],
  templateUrl: './long-press.html',
  styleUrl: './long-press.scss',
})
export default class LongPress {
  protected readonly duration = signal(500);
  protected readonly pulsing = signal(false);
  protected readonly log = signal<string[]>([]);

  protected readonly durationLabel = computed(() => `${(this.duration() / 1000).toFixed(1)}s`);

  protected onLongPress(): void {
    this.pulsing.set(true);
    this.log.update(l => [
      `Long press triggered at ${new Date().toLocaleTimeString()}`,
      ...l
    ].slice(0, 5));
  }

  protected onPulseEnd(): void {
    this.pulsing.set(false);
  }
}
