import {Routes} from '@angular/router';
import {productResolver} from './resolvers/product-detail.resolver';
import {productsResolver} from './resolvers/product-list.resolver';
import {authGuard} from './guards/auth-guard';
import {unsavedChangesGuard} from './guards/unsaved-changes-guard';

export const ROUTE_PATHS = {
  home: '',
  projects: 'projects',
  projectDetail: 'projects/:id',
  admin: 'admin',
  contact: 'contact',
  about: 'about',
} as const;

export const ROUTE_DRIVEN_TEMPLATES: Routes = [
  {
    path: ROUTE_PATHS.home,
    loadComponent: () => import('./components/home'),
    title: 'Home',
    pathMatch: "full"
  }, {
    path: ROUTE_PATHS.projects,
    loadComponent: () => import('./components/project-list'),
    title: 'Project List',
    resolve: {
      products: productsResolver
    }
  }, {
    path: ROUTE_PATHS.projects,
    loadComponent: () => import('./components/project-sidebar'),
    title: 'Project Sidebar',
    outlet: 'sidebar'
  }, {
    path: ROUTE_PATHS.projectDetail,
    loadComponent: () => import('./components/project-detail'),
    title: 'Project Detail',
    data: {theme: 'detail-view'},
    resolve: {
      product: productResolver
    }
  }, {
    path: ROUTE_PATHS.admin,
    loadComponent: () => import('./components/admin'),
    title: 'Admin',
    canActivate: [authGuard]
  },
  {
    path: ROUTE_PATHS.contact,
    loadComponent: () => import('./components/contact'),
    title: 'Contact',
    canDeactivate: [unsavedChangesGuard]
  },
  {
    path: ROUTE_PATHS.about,
    loadComponent: () => import('./components/about'),
    title: 'About',
  },
];
