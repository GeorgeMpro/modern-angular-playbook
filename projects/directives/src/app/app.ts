import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Highlight} from '../../highlight';

@Component({
  selector: 'app-root',
  imports: [Highlight],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected color = '';
  protected readonly title = signal('directives');
}
