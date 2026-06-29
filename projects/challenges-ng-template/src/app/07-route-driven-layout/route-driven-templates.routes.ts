import {Router, Routes} from '@angular/router';

import {productResolver} from './resolvers/product-detail.resolver';
import {productsResolver} from './resolvers/product-list.resolver';
import {authGuard} from './guards/auth-guard';
import {unsavedChangesGuard} from './guards/unsaved-changes-guard';

export const SHELL_PATH = 'route-driven-templates';

export const ROUTE_PATHS = {
  home: '',
  products: 'products',
  productDetail: 'products/:id',
  admin: 'admin',
  contact: 'contact',
  about: 'about',
} as const;

export const ROUTE_DRIVEN_TEMPLATES: Routes = [
  {
    path: ROUTE_PATHS.home,
    loadComponent: () => import('./components/home'),
    title: 'Home',
    pathMatch: 'full'
  }, {
    path: ROUTE_PATHS.products,
    loadComponent: () => import('./components/product-list'),
    title: 'Product List',
    resolve: {
      products: productsResolver
    }
  }, {
    path: ROUTE_PATHS.products,
    loadComponent: () => import('./components/product-sidebar'),
    title: 'Product Sidebar',
    outlet: 'sidebar'
  }, {
    path: ROUTE_PATHS.productDetail,
    loadComponent: () => import('./components/product-detail'),
    title: 'Product Detail',
    data: {theme: 'detail-view'},
    resolve: {
      product: productResolver
    }
  }, {
    path: ROUTE_PATHS.admin,
    loadComponent: () => import('./components/admin'),
    title: 'Admin',
    canActivate: [authGuard('/route-driven-templates')]
  }, {
    path: ROUTE_PATHS.contact,
    loadComponent: () => import('./components/contact'),
    title: 'Contact',
    canDeactivate: [unsavedChangesGuard]
  }, {
    path: ROUTE_PATHS.about,
    loadComponent: () => import('./components/about'),
    title: 'About',
  },
];


export function navigateToProducts(router: Router): void {
  //Notice: Named outlets in child routes require relativeTo; routerLink alone won't activate them
  router.navigate([SHELL_PATH, {
    outlets: {primary: [ROUTE_PATHS.products], sidebar: [ROUTE_PATHS.products]}
  }])
}
