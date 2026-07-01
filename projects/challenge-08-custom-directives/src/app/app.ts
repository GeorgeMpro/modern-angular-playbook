import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {ThemeToggle} from 'ui-theme';
import {PageTitleStrategy} from './shared/title-strategy';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggle, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly titleStrategy = inject(PageTitleStrategy);
}
