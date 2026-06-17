import {DOCUMENT, inject, Service, signal} from '@angular/core';

export type MainTheme = 'light' | 'dark';

@Service()
export class Theme {

  private readonly document = inject(DOCUMENT);
  readonly theme = signal<MainTheme>('dark')

  toggle(): void {
    this.theme.update(t => {
      let isDark = t === 'dark';
      return isDark ? 'light' : 'dark';
    });

    this.document.body.setAttribute('data-theme', this.theme());
  }
}
