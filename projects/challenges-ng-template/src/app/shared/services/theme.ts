import {computed, DOCUMENT, inject, Service, signal} from '@angular/core';

export type MainTheme = 'light' | 'dark';

@Service()
export class Theme {

  private readonly document = inject(DOCUMENT);
  readonly theme = signal<MainTheme>('dark');
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.document.documentElement.setAttribute('data-theme', this.theme());
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
    this.document.documentElement.setAttribute('data-theme', this.theme());
  }
}
