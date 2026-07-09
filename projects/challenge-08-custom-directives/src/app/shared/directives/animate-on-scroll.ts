import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal
} from '@angular/core';

@Directive({
  selector: '[appAnimateOnScroll]',
  host: {
    '[class]': 'hostClass()'
  }
})
export class AnimateOnScroll {

  private readonly options: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.0,
  };

  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly animationClass = input<string>('visible');
  readonly repeat = input<boolean>(false);

  private readonly shouldAddClass = signal(false);
  private readonly observer = signal<IntersectionObserver | undefined>(undefined);

  protected readonly hostClass = computed<string>(() => {
    return this.shouldAddClass() ? this.animationClass() : '';
  });

  constructor() {
    afterNextRender({
      write: () => {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            entry.isIntersecting ? this.handleIntersection(observer) :
              this.handleLeave();
          })
        }, this.options);

        this.observer.set(observer);
        observer.observe(this.el.nativeElement);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
    });

    effect(() => {
      if (this.observer() && this.repeat()) {
        this.observer()?.observe(this.el.nativeElement);
      }
    })
  }

  private handleIntersection(observer: IntersectionObserver) {
    this.shouldAddClass.set(true);
    if (!this.repeat()) observer.disconnect();
  }

  private handleLeave() {
    if (this.repeat()) this.shouldAddClass.set(false);
  }
}
