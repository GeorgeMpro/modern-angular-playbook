import {Component, ElementRef, inject, signal, viewChild } from '@angular/core';

import {LucideDynamicIcon, LucideMoon, LucideSun} from '@lucide/angular';
import {ThemeService} from '../theme.service';

@Component({
  selector: 'lib-theme-toggle',
  imports: [
    LucideDynamicIcon
  ],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  readonly sunIcon = LucideSun;
  readonly moonIcon = LucideMoon;
  rotated = signal(false);

  protected readonly theme = inject(ThemeService);

  protected readonly rotatorRef = viewChild.required<ElementRef<HTMLElement>>('rotator');

  onToggle(): void {
    this.rotated.update(v => !v);
    this.triggerRotate();
    this.theme.toggle();
  }

  private triggerRotate(): void {
    const el = this.rotatorRef().nativeElement;
    el.classList.remove('rotate');
    void el.offsetWidth;
    el.classList.add('rotate');
  }
}
