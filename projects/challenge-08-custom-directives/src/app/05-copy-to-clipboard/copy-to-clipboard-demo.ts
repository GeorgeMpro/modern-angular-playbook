import {Component, signal} from '@angular/core';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {CopyToClipboard} from './copy-to-clipboard';

@Component({
  selector: 'app-copy-to-clipboard-demo',
  imports: [
    DemoShell,
    CopyToClipboard
  ],
  templateUrl: './copy-to-clipboard-demo.html',
  styleUrl: './copy-to-clipboard-demo.scss',
})
export default class CopyToClipboardDemo {
  private readonly toCopy = "Copy to clipboard";
  protected readonly text = signal('Hello, world!');

  protected readonly tooltipMessage = signal(this.toCopy);

  protected onMouseOut(): void {
    this.tooltipMessage.set(this.toCopy);
  }

  protected onCopied(success: boolean): void {
    this.tooltipMessage.set(success ? `Copied: ${this.text()}` : 'Failed!');
  }
}
