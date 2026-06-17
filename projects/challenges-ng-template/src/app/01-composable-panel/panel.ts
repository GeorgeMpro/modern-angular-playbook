import {Component, contentChild, input, TemplateRef} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';

import {Theme} from './composable-panel';

@Component({
  selector: 'app-panel',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
})
export class Panel {

  readonly theme = input<Theme>('primary');


  readonly headerTemplate = input<TemplateRef<void>>();
  readonly footerTemplate = contentChild<TemplateRef<void>>('footer');


}
