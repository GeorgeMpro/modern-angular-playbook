import { Component, computed, signal } from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppResizeObserver} from '../shared/directives/app-resize-observer';

@Component({
  selector: 'app-resize-observer',
  imports: [
    DemoShell,
    AppResizeObserver,
    DecimalPipe
  ],
  templateUrl: './resize-observer.html',
  styleUrl: './resize-observer.scss',
})
export default class ResizeObserverDemo {
  protected readonly dimensions = signal({width: 0, height: 0});
  protected readonly layoutMode = computed(() => this.dimensions().width < 260 ? 'Compact' : 'Full');
}
