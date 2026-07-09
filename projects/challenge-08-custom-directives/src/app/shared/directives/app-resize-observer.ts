import {afterNextRender, DestroyRef, Directive, ElementRef, inject, output} from '@angular/core';

interface Dimensions {
  height: number;
  width: number;
}

@Directive({
  selector: '[appResizeObserver]',
})
export class AppResizeObserver {

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly resize = output<Dimensions>();

  constructor() {
    afterNextRender({
      write: () => {
        const observer = new ResizeObserver((entries) => {
          entries.forEach(entry => {
            const {width, height} = entry.contentRect;
            this.resize.emit({height, width});
          });
        });

        observer.observe(this.el.nativeElement);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
    })
  }
}
