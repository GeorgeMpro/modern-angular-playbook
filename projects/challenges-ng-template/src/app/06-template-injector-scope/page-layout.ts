import {Component, inject, Injector, input, TemplateRef} from '@angular/core';

import {NgTemplateOutlet} from '@angular/common';

import {LayoutTheme} from './layout-theme';

@Component({
  selector: 'app-page-layout',
  imports: [
    NgTemplateOutlet
  ],
  providers: [
    LayoutTheme
  ],
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.scss',
})
export class PageLayout {

  protected readonly injector = inject(Injector);
  private readonly service = inject(LayoutTheme);
  readonly contentSlot = input.required<TemplateRef<void>>();

  protected toggleTheme() {
    this.service.toggle();
  }
}
