import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }, {
    path: 'home',
    loadComponent: () => import('./home/home'),
    title: 'Home'
  },
  {
    path: 'composable-panel',
    loadComponent: () => import('./01-composable-panel/composable-panel'),
    title: 'The Composable Panel'
  },
  {
    path: 'configurable-modal',
    loadComponent: () => import('./02-configurable-modal/configurable-modal'),
    title: 'Configurable Modal'
  }

];
