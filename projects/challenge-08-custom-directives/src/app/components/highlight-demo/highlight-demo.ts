import {Component, signal} from '@angular/core';
import {Highlight} from '../../directives/highlight';
import {TitleCasePipe} from '@angular/common';
import {DemoShell} from '../demo-shell/demo-shell';

interface Colors {
  label: string;
  color: string;
}

const COLORS: Record<string, string> = {
  'slate': '#1e293b',
  'yellow': '#fef08a',
  'cyan': '#a5f3fc',
  'rose': '#fecdd3',
  'violet': '#ddd6fe',
  'emerald': '#a7f3d0',
  'indigo': '#312e81',
}

@Component({
  selector: 'app-highlight-demo',
  imports: [
    Highlight,
    TitleCasePipe,
    DemoShell
  ],
  templateUrl: './highlight-demo.html',
  styleUrl: './highlight-demo.scss',
})
export class HighlightDemo {

  protected readonly colorsDisplay: Colors[] = Object.entries(COLORS).map(
    ([label, color]) => ({
      label: label,
      color: color
    })
  );

  protected readonly color = signal<string>('');
}
