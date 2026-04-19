import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Toast} from './components/toast/toast';
import {ErrorTest} from './components/error-test/error-test';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ErrorTest],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('challenge-11-centralized-error-handling');
}
