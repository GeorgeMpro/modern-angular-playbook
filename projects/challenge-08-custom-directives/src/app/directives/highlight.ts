import {computed, Directive, ElementRef, inject, input, signal} from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[style.background-color]': 'currentColor()',
    '[style.color]': 'fontColor()',
    '[style.font-weight]':'600'
  }
})
export class Highlight {
  private readonly fontDark = '#111827';
  private readonly fontLight = '#f3f4f6'

  appHighlight = input<string>('');
  defaultColor = input.required<string>();

  protected readonly currentColor = signal<string>('');

  protected readonly fontColor = computed(() => {
    const bg = this.currentColor();
    if (!bg) return 'inherit';
    return this.isLight(bg) ? this.fontDark : this.fontLight;
  });

  protected onMouseEnter() {
    this.currentColor.set(
      this.appHighlight() || this.defaultColor() || 'yellow'
    );
  }

  protected onMouseLeave() {
    this.currentColor.set('');
  }

  private isLight(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Perceptive luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }


}
