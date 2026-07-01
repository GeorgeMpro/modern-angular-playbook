import {afterNextRender, DestroyRef, Directive, ElementRef, inject, input, Renderer2} from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
})
export class AppLazyLoad {

  readonly source = input.required<string>();

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  private readonly options: IntersectionObserverInit = {
    root: null,
    rootMargin: '200px',
    threshold: 0.0
  }

  constructor() {
    afterNextRender({
      write: () => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.renderer.setProperty(this.el.nativeElement, 'src', this.source());
              observer.disconnect();
            }
          });
        }, this.options);

        observer.observe(this.el.nativeElement);
        this.destroyRef.onDestroy(() => observer.disconnect())
      }
    })
  }

}
