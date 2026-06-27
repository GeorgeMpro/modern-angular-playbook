import {Routes} from '@angular/router';

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
  }, {
    path: 'projects/:id',
    loadComponent: () => import('./project-detail'),
    title: 'Project Detail',
  }, {
    path: 'about',
    loadComponent: () => import('./about'),
    title: 'About',
  },
];
