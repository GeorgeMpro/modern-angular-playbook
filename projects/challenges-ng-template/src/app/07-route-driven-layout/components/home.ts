import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';

import {navigateToProducts} from '../route-driven-templates.routes';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  private readonly router = inject(Router);

  protected navigateToProducts(): void {
    navigateToProducts(this.router);
  }
}
