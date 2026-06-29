import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ProductMock} from '../../shared/services/product-mock';
import {ROUTE_PATHS} from '../route-driven-templates.routes';

@Component({
  selector: 'app-product-sidebar',
  templateUrl: './product-sidebar.html',
  styleUrl: './product-sidebar.scss',
})
export default class ProductSidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly products = inject(ProductMock).getProducts();

  protected navigateToProduct(id: number): void {
    this.router.navigate([ROUTE_PATHS.products, id], {relativeTo: this.route.parent});
  }

  protected closeSidebar(): void {
    this.router.navigate([{outlets: {sidebar: null}}], {relativeTo: this.route.parent});
  }
}
