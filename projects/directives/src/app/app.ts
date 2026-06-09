import {Component, signal, ChangeDetectionStrategy} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Highlight} from '../../highlight';

@Component({
  selector: 'app-root',
  imports: [Highlight],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App {
  protected color = '';
  protected readonly title = signal('directives');
}
