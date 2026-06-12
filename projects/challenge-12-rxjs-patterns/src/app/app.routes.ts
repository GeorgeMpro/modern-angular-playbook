import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home'),
    title: 'Home'
  },
  {
    path: 'parallel-batcher',
    loadComponent: () => import('./01-parallel-batcher/parallel-batcher'),
    title: 'Parallel Batcher'
  },
  {
    path: 'recursive-crawler',
    loadComponent: () => import('./02-recursive-crawler/recursive-crawler'),
    title: 'Recursive Crawler'
  },
  {
    path: 'stream-multiplexer',
    loadComponent: () => import('./03-stream-multiplexer/stream-multiplexer'),
    title: 'Stream Multiplexer'
  },
  {
    path: 'async-state-accumulator',
    loadComponent: () => import('./04-async-state-accumulator/async-state-accumulator'),
    title: 'Async State Accumulator'
  },
  {
    path: 'stream-splitter',
    loadComponent: () => import('./05-stream-splitter/stream-splitter'),
    title: 'Stream Splitter'
  },
  {
    path: 'high-pressure-smoother',
    loadComponent: () => import('./06-high-pressure-smoother/high-pressure-smoother'),
    title: 'High Pressure Smoother'
  },
  {
    path: 'signal-bridge',
    loadComponent: () => import('./07-the-signal-bridge/signal-bridge'),
    title: 'Signal Bridge'
  },
  {
    path: 'form-guard',
    loadComponent: () => import('./08-form-guard/form-guard'),
    title: 'The Form Guard'
  },
  {
    path: 'dashboard-filter',
    loadComponent: () => import('./09-dashboard-filter/dashboard-filter'),
    title: 'The Dashboard Filter'
  },
  {
    path: 'save-queue',
    loadComponent: () => import('./10-save-queue/save-queue'),
    title: 'The Save Queue'
  },
  {
    path: 'window-processor',
    loadComponent: () => import('./11-window-processor/window-processor'),
    title: 'The Window Processor'
  },
  {
    path: 'subject-selector',
    loadComponent: () => import('./12-subject-selector/subject-selector'),
    title: 'The Subject Selector'
  }
];
