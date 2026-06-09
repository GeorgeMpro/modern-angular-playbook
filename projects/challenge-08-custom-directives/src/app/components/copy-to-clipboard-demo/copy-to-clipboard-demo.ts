import { Component, ChangeDetectionStrategy } from '@angular/core';
import {DemoShell} from '../demo-shell/demo-shell';

@Component({
  selector: 'app-copy-to-clipboard-demo',
  imports: [
    DemoShell
  ],
  templateUrl: './copy-to-clipboard-demo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './copy-to-clipboard-demo.scss',
})
export class CopyToClipboardDemo {

}
