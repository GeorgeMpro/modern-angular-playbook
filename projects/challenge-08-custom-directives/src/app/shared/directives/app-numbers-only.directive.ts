import {Directive, ElementRef, inject, Renderer2} from '@angular/core';

@Directive({
  selector: 'input[appNumbersOnly]',
  host: {
    '(keydown)': 'onKey($event)',
    '(paste)': 'onPaste($event)'
  }
})
export class AppNumbersOnly {

  private readonly allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight'
  ];
  private readonly regex: RegExp = /^\d$/;
  private readonly nonDigitPattern: RegExp = /[^\d]/g;

  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly renderer = inject(Renderer2);

  protected onKey(event: KeyboardEvent): void {
    const key = event.key;
    const isControlKey = this.allowedKeys.includes(key);
    const isNumber = this.regex.test(key);
    const isModifierCombo = event.ctrlKey || event.metaKey;

    if (isControlKey || isNumber || isModifierCombo) {
      return;
    }

    event.preventDefault();
  }

  protected onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const numericOnly = pasted.replace(this.nonDigitPattern, "");
    this.renderer.setProperty(this.el.nativeElement, 'value', numericOnly);

    event.preventDefault();
  }
}
