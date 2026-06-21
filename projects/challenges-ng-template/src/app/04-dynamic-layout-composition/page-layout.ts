import {Component, input, TemplateRef} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'app-page-layout',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.scss',
})
export class PageLayout {

  readonly main = input.required<TemplateRef<void>>();
  readonly sidebar = input<TemplateRef<void> | null>();
}
