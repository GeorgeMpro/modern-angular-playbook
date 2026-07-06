import {Component, input} from '@angular/core';
import {TitleCasePipe} from '@angular/common';
import {NavArrows} from '../../directives/nav-arrows';

@Component({
  selector: 'app-demo-shell',
  imports: [TitleCasePipe, NavArrows],
  templateUrl: './demo-shell.html',
  styleUrl: './demo-shell.scss',
  host: { '[attr.title]': 'null' },
})
export class DemoShell {
  public title = input.required<string>();
}
