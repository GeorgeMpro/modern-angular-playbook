import {Directive, ElementRef, inject, output} from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class ClickOutside {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly clickOutside = output<void>();

  protected onClick(click: MouseEvent): void {

    const isClickOutside = !this.el.nativeElement.contains(click.target as Node);
    if (isClickOutside) {
      this.clickOutside.emit();
    }
  }
}
