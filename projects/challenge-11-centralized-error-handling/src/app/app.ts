import {Component, signal, ChangeDetectionStrategy} from '@angular/core';
import {Toast} from './components/toast/toast';
import {ErrorTest} from './components/error-test/error-test';

@Component({
  selector: 'app-root',
  imports: [ Toast, ErrorTest],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('challenge-11-centralized-error-handling');
}
