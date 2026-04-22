import {Component, signal} from '@angular/core';

import {Highlight} from '../../directives/highlight';
import {TitleCasePipe} from '@angular/common';
import {DebounceClick} from '../../directives/debounce-click';

interface Colors {
  label: string;
  color: string;
}

const COLORS: Record<string, string> = {
  'green': 'lightgreen',
  'yellow': '#fef08a',
  'cyan': '#a5f3fc',
  'rose': '#fecdd3',
  'violet': '#ddd6fe',
  'amber': '#fde68a',
  'emerald': '#a7f3d0'
}

@Component({
  selector: 'app-directive-display',
  imports: [Highlight, TitleCasePipe, DebounceClick
  ],
  templateUrl: './directive-display.html',
  styleUrl: './directive-display.scss',
})
export class DirectiveDisplay {
  protected readonly clickCount = signal<number>(0);
  protected readonly log = signal<string[]>([]);

  protected readonly colorsDisplay: Colors[] = Object.entries(COLORS).map(
    ([label, color]) => ({
      label: label,
      color: color
    })
  );

  protected readonly color = signal<string>('');
  protected onDebounceClick(): void {
    this.clickCount.update(v => v + 1);
    this.debounceLog();
  }

  protected debounceLog() {
    this.log.update(l => [`Action triggered at ${new Date().toLocaleTimeString()}`, ...l].slice(0, 5));
  }
}
