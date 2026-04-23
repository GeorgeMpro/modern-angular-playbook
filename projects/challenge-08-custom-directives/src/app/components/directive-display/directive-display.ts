import {Component, signal} from '@angular/core';

import {Highlight} from '../../directives/highlight';
import {TitleCasePipe} from '@angular/common';
import {DebounceClick} from '../../directives/debounce-click';
import {HighlightDemo} from '../highlight-demo/highlight-demo';


@Component({
  selector: 'app-directive-display',
  imports: [Highlight, TitleCasePipe, DebounceClick, HighlightDemo
  ],
  templateUrl: './directive-display.html',
  styleUrl: './directive-display.scss',
})
export class DirectiveDisplay {
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
