import {Service, signal} from '@angular/core';

import {Theme} from '../shared/models/theme.model';


@Service({
  autoProvided: false
})
export class LayoutTheme {

  private readonly _theme = signal<Theme>('dark');
  readonly theme = this._theme.asReadonly();

  public toggle(): void {
    this._theme.update(curr => curr === 'light' ? 'dark' : 'light');
  }
}
