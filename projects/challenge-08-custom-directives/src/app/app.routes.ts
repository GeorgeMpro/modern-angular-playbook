import {Routes} from '@angular/router';


export const ROUTE_PATHS = {
  home: 'home',
  lazyLoad: 'lazy-load',
  debounceClick: 'debounce-click',
  infiniteScroll: 'infinite-scroll',
  clickOutside: 'click-outside',
  toolTip: 'tooltip',
  copyToClipboard: 'copy-to-clipboard',
  autoFocus: 'auto-focus',
  highlight: 'highlight',
  permission: 'permission',

} as const;

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }, {
    path: ROUTE_PATHS.home,
    loadComponent: () => import('./shared/components/home/home'),
    title: pathToTitle(ROUTE_PATHS.home)
  }, {
    path: ROUTE_PATHS.lazyLoad,
    loadComponent: () => import('./01-lazy-load/lazy-load'),
    title: pathToTitle(ROUTE_PATHS.lazyLoad)
  },
  {
    path: ROUTE_PATHS.debounceClick,
    loadComponent: () => import('./02-debounce-click/debounce-click-demo'),
    title: pathToTitle(ROUTE_PATHS.debounceClick)
  }, {
    path: ROUTE_PATHS.infiniteScroll,
    loadComponent: () => import('./03-infinite-scroll/infinite-scroll-demo.component'),
    title: pathToTitle(ROUTE_PATHS.infiniteScroll)
  }, {
    path: ROUTE_PATHS.clickOutside,
    loadComponent: () => import('./04-click-outside/./click-outside-demo'),
    title: pathToTitle(ROUTE_PATHS.clickOutside)
  }, {
    path: ROUTE_PATHS.copyToClipboard,
    loadComponent: () => import('./05-copy-to-clipboard/copy-to-clipboard-demo'),
    title: pathToTitle(ROUTE_PATHS.copyToClipboard)
  }, {
    path: ROUTE_PATHS.toolTip,
    loadComponent: () => import('./06-tooltip/tooltip'),
    title: pathToTitle(ROUTE_PATHS.toolTip)
  }, {
    path: ROUTE_PATHS.autoFocus,
    loadComponent: () => import('./07-auto-focus/auto-focus'),
    title: pathToTitle(ROUTE_PATHS.autoFocus)
  }, {
    path: ROUTE_PATHS.highlight,
    loadComponent: () => import('./08-highlight/highlight-demo'),
    title: pathToTitle(ROUTE_PATHS.highlight)
  }, {
    path: ROUTE_PATHS.permission,
    loadComponent: () => import('./09-permission/permission'),
    title: pathToTitle(ROUTE_PATHS.permission)
  },
];

export function pathToTitle(path: string): string {
  return path.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
