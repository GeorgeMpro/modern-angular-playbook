import {Directive, ElementRef, inject, input, OnDestroy, Renderer2} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()'
  }
})
export class AppTooltip implements OnDestroy {

  private readonly GAP = 8;
  private readonly RADIX = 36;
  private readonly TOOLTIP_CLASS = 'app-tooltip';

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  readonly tooltipText = input.required<string>();

  private tooltip: HTMLElement | null = null;

  protected show(): void {
    if (this.tooltip) return;
    const tooltipEl = this.createTooltip();
    this.renderer.appendChild(document.body, tooltipEl);
    this.positionTooltip(tooltipEl);
  }

  protected hide(): void {
    if (!this.tooltip) return;
    this.renderer.removeChild(document.body, this.tooltip);
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-describedby');
    this.tooltip = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private createTooltip(): HTMLElement {
    const id = `tooltip-${Math.random().toString(this.RADIX).slice(2)}`;
    const tooltipEl: HTMLElement = this.renderer.createElement('div');
    this.tooltip = tooltipEl;

    this.renderer.setAttribute(tooltipEl, 'id', id);
    this.renderer.setAttribute(tooltipEl, 'role', 'tooltip');
    this.renderer.setAttribute(this.el.nativeElement, 'aria-describedby', id);
    this.renderer.addClass(tooltipEl, this.TOOLTIP_CLASS);
    this.renderer.appendChild(tooltipEl, this.renderer.createText(this.tooltipText()));

    return tooltipEl;
  }

  private positionTooltip(tooltipEl: HTMLElement): void {
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    const top = hostRect.top + window.scrollY - tooltipRect.height - this.GAP;
    const left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;

    this.renderer.setStyle(tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(tooltipEl, 'left', `${left}px`);
  }
}
