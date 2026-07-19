import {Component, input} from '@angular/core';

import {TitleCasePipe} from '@angular/common';
import {ArrowNavigation} from 'ui-theme';

@Component({
  selector: 'app-demo-shell',
  imports: [TitleCasePipe, ArrowNavigation],
  templateUrl: './demo-shell.html',
  styleUrl: './demo-shell.scss',
  host: {'[attr.title]': 'null'},
})
export class DemoShell {
  public title = input.required<string>();
}
