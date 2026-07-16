import {Directive, input} from '@angular/core';

@Directive({
  selector: '[appExitConfirm]',
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)'
  }
})
export class AppExitConfirm {
  readonly dirty = input.required<boolean>();

  protected onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty()) {
      event.preventDefault();
    }
  }
}
