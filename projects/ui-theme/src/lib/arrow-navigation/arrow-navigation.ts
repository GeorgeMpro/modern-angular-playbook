import {Component, computed, inject, InjectionToken, Provider} from '@angular/core';

import {NavigationEnd, Router, Routes} from '@angular/router';

import {toSignal} from '@angular/core/rxjs-interop';
import {filter, map} from 'rxjs';

export const NAV_ARROW_ROUTES = new InjectionToken<string[]>('navArrowRoutes');

export function provideNavArrowRoutes(appRoutes: Routes, excludePaths: string[]): Provider {
  const filtered = appRoutes
    .filter(r => r.path && !excludePaths.includes(r.path))
    .map(r => '/' + r.path);
  return {provide: NAV_ARROW_ROUTES, useValue: filtered}
}

@Component({
  selector: 'app-arrow-navigation',
  imports: [],
  templateUrl: './arrow-navigation.html',
  styleUrl: './arrow-navigation.scss',
})
export class ArrowNavigation {

  private readonly routes = inject(NAV_ARROW_ROUTES);
  private readonly router = inject(Router);

  private readonly currentUrl$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => this.router.url)
  );

  private readonly currentUrl = toSignal(this.currentUrl$, {
    initialValue: this.router.url
  })

  protected readonly shouldRender = computed(() => this.currentIndex() !== -1);
  private readonly currentIndex = computed(
    () => this.routes.indexOf(this.currentUrl())
  );

  private readonly prevRoute = computed(() => {
    const i = this.currentIndex();
    return this.routes[i === 0 ? this.routes.length - 1 : i - 1];
  });

  private readonly nextRoute = computed(() => {
    const i = this.currentIndex();
    return this.routes[i === this.routes.length - 1 ? 0 : i + 1];
  });

  protected onPrevRoute() {
    this.router.navigate([this.prevRoute()])
  }


  protected onNextRoute() {
    this.router.navigate([this.nextRoute()]);
  }
}
