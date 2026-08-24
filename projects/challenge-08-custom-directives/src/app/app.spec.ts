import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {DebugElement} from '@angular/core';
import {RouterTestingHarness} from '@angular/router/testing';
import {By} from '@angular/platform-browser';

import {App} from './app';
import Home from "./shared/components/home/home";
import {provideNavArrowRoutes} from 'ui-theme';
import {ROUTE_PATHS, routes} from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        Home,
      ],
      providers: [provideRouter(routes), provideNavArrowRoutes(routes, ['home'])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should navigate to home component`, async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('', Home);

    const title = 'Custom Directives';
    expect(harness.routeNativeElement?.textContent).toContain(title);
  });

  const unknownPaths = ['/nothing', '/xyzu', '/foo/bar'];
  it.for(unknownPaths)(`should not throw for %s`, async (path) => {
    const harness = await RouterTestingHarness.create();

    await expect(harness.navigateByUrl(path, Home)).resolves.not.toThrow();
  });

  it(`should apply active class on the home route, not elsewhere`, async () => {
    const selector = 'a.nav-link';
    const className = 'active';

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl(`/${ROUTE_PATHS.home}`);
    fixture.detectChanges();
    await fixture.whenStable();

    let link = fixture.debugElement.query(By.css(selector));
    expectHasClass(link, className, true);

    await router.navigateByUrl(ROUTE_PATHS.longPress);
    fixture.detectChanges();
    await fixture.whenStable();

    link = fixture.debugElement.query(By.css(selector));
    expectHasClass(link, className, false);
  });
});

function expectHasClass(el: DebugElement, className: string, expected: boolean): void {
  const hasClass = el.nativeElement.classList.contains(className);
  expect(hasClass).toBe(expected);
}
