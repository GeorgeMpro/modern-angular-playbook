import {Routes} from '@angular/router';
import {productResolver} from './product-detail.resolver';
import {productsResolver} from './product-list.resolver';

export const ROUTE_DRIVEN_TEMPLATES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home'),
    title: 'Home',
    pathMatch: "full"
  }, {
    path: 'projects',
    loadComponent: () => import('./project-list'),
    title: 'Project List',
    resolve: {
      products: productsResolver
    }
  }, {
    path: 'projects/:id',
    loadComponent: () => import('./project-detail'),
    title: 'Project Detail',
    data: {theme: 'detail-view'},
    resolve: {
      product: productResolver
    }
  }, {
    path: 'about',
    loadComponent: () => import('./about'),
    title: 'About',
  },
];
