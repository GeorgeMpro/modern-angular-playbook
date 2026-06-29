import {Directive, inject} from '@angular/core';

import {LayoutTheme} from './layout-theme';

@Directive({
  selector: '[appTheme]',
  exportAs: 'themeReader'
})
export class ThemeReader {

  private readonly service = inject(LayoutTheme);
  readonly theme = this.service.theme;
}
