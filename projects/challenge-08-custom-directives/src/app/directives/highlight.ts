import {Directive, ElementRef, inject, input, signal} from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[style.background-color]': 'currentColor()'
  }
})
export class Highlight {

  appHighlight = input<string>('');
  defaultColor = input.required<string>();

  protected readonly currentColor = signal<string>('');

  protected onMouseEnter() {
    this.currentColor.set(
      this.appHighlight() || this.defaultColor() || 'yellow'
    );
  }

  protected onMouseLeave() {
    this.currentColor.set('');
  }

}
