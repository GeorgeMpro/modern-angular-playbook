import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {ThemeToggle} from 'ui-theme';
import {Toast} from './components/toast/toast';
import {ErrorTest} from './components/error-test/error-test';

@Component({
  selector: 'app-root',
  imports: [Toast, ErrorTest, ThemeToggle],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('challenge-11-centralized-error-handling');
}
