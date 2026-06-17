import {Component, ElementRef, inject, signal, ViewChild} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {LucideAngularModule, Moon, Sun} from 'lucide-angular';

import {routes} from './app.routes';
import {Theme} from './shared/services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly navRoutes = routes.filter(r => r.path);
  protected readonly theme = inject(Theme);

  readonly sun = Sun;
  readonly moon = Moon;
  rotated = signal(false);

  @ViewChild('rotator') rotatorRef!: ElementRef<HTMLElement>;

  onToggle(): void {
    this.rotated.update(v => !v);
    this.triggerRotate();
    this.theme.toggle();
  }

  private triggerRotate(): void {
    const el = this.rotatorRef.nativeElement;
    el.classList.remove('rotate');
    void el.offsetWidth;
    el.classList.add('rotate');
  }
}
