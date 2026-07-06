import {Directive, input, output} from '@angular/core';

@Directive({
  selector: '[appCopyToClipboard]',
  host: {
    '(click)': 'onCopy()'
  }
})
export class CopyToClipboard {

  readonly textToCopy = input.required<string>();
  readonly copied = output<boolean>();


  protected onCopy() {
    navigator.clipboard.writeText(this.textToCopy())
      .then(() => this.copied.emit(true))
      .catch(() => this.copied.emit(false));
  }
}
