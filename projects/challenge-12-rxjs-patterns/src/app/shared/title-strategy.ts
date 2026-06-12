import {Injectable, signal} from '@angular/core';
import {RouterStateSnapshot, TitleStrategy} from '@angular/router';

@Injectable({providedIn: 'root'})
export class PageTitleStrategy extends TitleStrategy {
  readonly currentTitle = signal('');

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.currentTitle.set(title ?? '');
  }
}
