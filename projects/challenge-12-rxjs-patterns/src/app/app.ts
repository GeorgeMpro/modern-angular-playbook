import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {PageTitleStrategy} from './shared/title-strategy';
import {ThemeToggle} from 'ui-theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ThemeToggle],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss'
})
export class App {
  protected readonly titleStrategy = inject(PageTitleStrategy);
}
