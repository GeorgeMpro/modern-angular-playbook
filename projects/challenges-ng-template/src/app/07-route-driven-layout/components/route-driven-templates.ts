import {Component, inject, signal,} from '@angular/core';

import {ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {Auth} from '../services/auth';
import {navigateToProducts, ROUTE_PATHS, SHELL_PATH} from '../route-driven-templates.routes';

@Component({
  selector: 'app-route-driven-templates',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './route-driven-templates.html',
  styleUrl: './route-driven-templates.scss',
})
export default class RouteDrivenTemplates {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute)
  private readonly authService = inject(Auth);

  protected readonly isLoggedIn = this.authService.isLoggedIn;
  protected readonly sidebarActive = signal(false);

  public goToProducts(): void {
    navigateToProducts(this.router);
  }

  protected toggleLogin() {
    this.isLoggedIn() ? this.logout() : this.login();
  }

  private logout(): void {
    this.authService.logout()
    if (this.router.url.includes(ROUTE_PATHS.admin)) {
      this.router.navigate(['./'], {relativeTo: this.route})
    }
  }

  private login(): void {
    this.authService.login();
    this.router.navigateByUrl(`${SHELL_PATH}/${ROUTE_PATHS.admin}`);
  }
}
