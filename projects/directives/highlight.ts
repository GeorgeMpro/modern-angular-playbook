import {
  Directive,
  ElementRef
  , inject, input
} from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()'
  }
})
export class Highlight {

  private el = inject(ElementRef);

  readonly appHighlight = input<string>('');
  readonly defaultColor = input<string>('');


  onMouseEnter(): void {
    this.highlight(this.appHighlight() || this.defaultColor() || 'red');
  }

  onMouseLeave(): void {
    this.highlight('');
  }


  private highlight(color: string): void {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
