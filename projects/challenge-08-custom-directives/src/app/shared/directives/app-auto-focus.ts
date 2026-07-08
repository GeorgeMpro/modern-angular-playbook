import {afterNextRender, Directive, ElementRef, inject, input} from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AppAutoFocus {
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly shouldFocus = input<boolean>(true);

  constructor() {
    afterNextRender(() => {
      // Notice: we need a lifecycle after onInit for the input
      if (this.shouldFocus()) {
        this.el.nativeElement.focus();
      }
    });
  }

}
