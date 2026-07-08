import {Directive, signal} from '@angular/core';

type IndicatorMessage = "Focused" | "Unfocused";

@Directive({
  selector: '[appFocusStatus]',
  exportAs: 'focusStatus',
  host: {
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()'
  }
})
export class FocusStatus {
  readonly indicator = signal<IndicatorMessage>('Unfocused');

  protected onFocus(): void {
    this.indicator.set("Focused");
  }

  protected onBlur(): void {
    this.indicator.set("Unfocused");
  }
}
