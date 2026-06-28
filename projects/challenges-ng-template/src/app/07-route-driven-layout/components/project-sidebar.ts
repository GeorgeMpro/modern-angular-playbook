import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ProductMock} from '../../shared/services/product-mock';
import {ROUTE_PATHS} from '../route-driven-templates.routes';

@Component({
  selector: 'app-project-sidebar',
  templateUrl: './project-sidebar.html',
  styleUrl: './project-sidebar.scss',
})
export default class ProjectSidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly products = inject(ProductMock).getProducts();

  // routerLink navigates from the sidebar outlet context, not the primary outlet.
  // relativeTo: this.route.parent anchors navigation to route-driven-templates instead.
  protected navigateToProject(id: number): void {
    this.router.navigate([ROUTE_PATHS.projects, id], {relativeTo: this.route.parent});
  }

  protected closeSidebar(): void {
    this.router.navigate([{outlets: {sidebar: null}}], {relativeTo: this.route.parent});
  }
}
