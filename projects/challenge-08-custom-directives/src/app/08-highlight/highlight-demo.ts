import {Component} from '@angular/core';
import {Highlight} from '../shared/directives/highlight';
import {TitleCasePipe} from '@angular/common';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';

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
  'orange': '#fed7aa',
  'fuchsia': '#f0abfc',
  'teal': '#0f766e',
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
export default class HighlightDemo {

  protected readonly colorsDisplay: Colors[] = Object.entries(COLORS).map(
    ([label, color]) => ({label, color})
  );
}
