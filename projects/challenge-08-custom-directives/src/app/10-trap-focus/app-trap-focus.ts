import {Directive, DOCUMENT, ElementRef, inject} from '@angular/core';

@Directive({
  selector: '[appTrapFocus]',
  host: {
    '(keydown.tab)': 'onTab($event)',
    '(keydown.shift.tab)': 'onShiftTab($event)'
  }
})
export class AppTrapFocus {

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);

  protected onTab(event: Event): void {
    this.handleMovement(event, "forwards");
  }

  protected onShiftTab(event: Event): void {
    this.handleMovement(event, "backwards");
  }

  private handleMovement(event: Event, direction: "forwards" | "backwards"): void {
    const items = this.getElements();
    const activeElement = this.document.activeElement as HTMLElement;
    const currentIndex = items.indexOf(activeElement);

    const isForward = direction === "forwards";
    const boundaryIndex = isForward ? items.length - 1 : 0;
    const targetIndex = isForward ? 0 : items.length - 1;

    if (currentIndex !== -1 && currentIndex === boundaryIndex) {
      event.preventDefault();
      items[targetIndex].focus();
    }
  }

  private getElements(): HTMLElement[] {
    return Array.from(
      this.el.nativeElement.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ));
  }
}
