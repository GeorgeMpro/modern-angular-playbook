import {computed, DestroyRef, Directive, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Renderer2} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {filter, map} from 'rxjs';
import {routes} from '../../app.routes';

@Directive({
  selector: '[appNavArrows]',
})
export class NavArrows implements OnInit {

  private readonly PREV_CLASS = 'nav-arrow nav-arrow--prev';
  private readonly NEXT_CLASS = 'nav-arrow nav-arrow--next';

  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  private readonly demoRoutes = routes
    .filter(r => r.path && r.path !== '' && r.path !== 'home')
    .map(r => '/' + r.path);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  private readonly currentIndex = computed(() =>
    this.demoRoutes.indexOf(this.url())
  );

  private readonly prevRoute = computed(() => {
    const i = this.currentIndex();
    return this.demoRoutes[i === 0 ? this.demoRoutes.length - 1 : i - 1];
  });

  private readonly nextRoute = computed(() => {
    const i = this.currentIndex();
    return this.demoRoutes[i === this.demoRoutes.length - 1 ? 0 : i + 1];
  });

  private prevBtn: HTMLElement | null = null;
  private nextBtn: HTMLElement | null = null;
  private unlistenPrev: (() => void) | null = null;
  private unlistenNext: (() => void) | null = null;

  ngOnInit(): void {
    this.prevBtn = this.createButton(this.PREV_CLASS, '‹', 'Previous directive');
    this.nextBtn = this.createButton(this.NEXT_CLASS, '›', 'Next directive');

    this.unlistenPrev = this.renderer.listen(this.prevBtn, 'click', () =>
      void this.router.navigate([this.prevRoute()])
    );
    this.unlistenNext = this.renderer.listen(this.nextBtn, 'click', () =>
      void this.router.navigate([this.nextRoute()])
    );

    this.renderer.appendChild(document.body, this.prevBtn);
    this.renderer.appendChild(document.body, this.nextBtn);

    this.destroyRef.onDestroy(() => {
      this.unlistenPrev?.();
      this.unlistenNext?.();
      if (this.prevBtn) this.renderer.removeChild(document.body, this.prevBtn);
      if (this.nextBtn) this.renderer.removeChild(document.body, this.nextBtn);
    });
  }

  private createButton(classes: string, label: string, ariaLabel: string): HTMLElement {
    const btn: HTMLElement = this.renderer.createElement('button');
    classes.split(' ').forEach(cls => this.renderer.addClass(btn, cls));
    this.renderer.setAttribute(btn, 'aria-label', ariaLabel);
    this.renderer.appendChild(btn, this.renderer.createText(label));
    return btn;
  }
}
