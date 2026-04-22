import {Component, signal} from '@angular/core';

import {Highlight} from '../../directives/highlight';
import {TitleCasePipe} from '@angular/common';

interface Colors {
  label: string;
  color: string;
}

@Component({
  selector: 'app-directive-display',
  imports: [Highlight, TitleCasePipe
  ],
  templateUrl: './directive-display.html',
  styleUrl: './directive-display.scss',
})
export class DirectiveDisplay {
  private readonly colors: Record<string, string> = {
    'green': 'lightgreen',
    'yellow': '#fef08a',
    'cyan': '#a5f3fc',
    'rose': '#fecdd3',
    'violet': '#ddd6fe',
    'amber': '#fde68a',
    'emerald': '#a7f3d0'
  }
  protected readonly colorsDisplay: Colors[] = Object.entries(this.colors).map(
    ([label, color]) => ({
      label: label,
      color: color
    })
  );
  protected readonly color = signal<string>('');
}
