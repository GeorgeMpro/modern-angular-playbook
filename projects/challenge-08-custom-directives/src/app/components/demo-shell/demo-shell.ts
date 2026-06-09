import {Component, input, ChangeDetectionStrategy} from '@angular/core';
import {TitleCasePipe} from '@angular/common';

@Component({
  selector: 'app-demo-shell',
  imports: [
    TitleCasePipe
  ],
  templateUrl: './demo-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './demo-shell.scss',
})
export class DemoShell {

  public title = input.required<string>();
}
