import {Component} from '@angular/core';

import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

import {routes} from './app.routes';
import {ThemeToggle} from 'ui-theme';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ThemeToggle
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly navRoutes = routes.filter(r => r.path);
}
