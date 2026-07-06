import {Component, signal} from '@angular/core';
import {ClickOutside} from './click-outside.directive';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';

@Component({
  selector: 'app-click-outside',
  imports: [
    ClickOutside,
    DemoShell,
  ],
  templateUrl: './click-outside-demo.html',
  styleUrl: './click-outside-demo.scss',
})
export default class ClickOutsideDemo {

  protected readonly isDropdownOpen = signal(false);
  protected readonly isMenuOpen = signal(false);
  protected readonly isBellOpen = signal(false);
  protected readonly dropdownAction = signal<string | null>(null);
  protected readonly menuAction = signal<string | null>(null);

  protected readonly notifications = signal([
    {id: 1, text: 'John pushed to feature/ch08', time: '2m ago', read: false},
    {id: 2, text: 'Build passed on main', time: '15m ago', read: false},
    {id: 3, text: 'PR review requested', time: '1h ago', read: true},
  ]);

  protected readonly searchQuery = signal('');
  protected readonly isSearchOpen = signal(false);

  protected readonly allResults = [
    'Angular Directives', 'Angular Signals', 'RxJS Operators',
    'TypeScript Generics', 'Angular Forms', 'Lazy Loading',
    'Infinite Scroll', 'Intersection Observer',
  ];

  protected readonly searchResults = signal<string[]>([]);

  protected onClickOutsideDropdown() {
    this.isDropdownOpen.set(false);
  }

  protected toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  protected onDropdownAction(action: string) {
    this.dropdownAction.set(action);
    this.isDropdownOpen.set(false);
  }

  protected onClickOutsideMenu() {
    this.isMenuOpen.set(false);
  }

  protected toggleUserMenu() {
    this.isMenuOpen.update(v => !v);
  }

  protected onMenuAction(action: string) {
    this.menuAction.set(action);
    this.isMenuOpen.set(false);
  }

  protected toggleBell() {
    this.isBellOpen.update(v => !v);
  }

  protected closeBell() {
    this.isBellOpen.set(false);
  }

  protected markRead(id: number) {
    this.notifications.update(list =>
      list.map(n => n.id === id ? {...n, read: true} : n)
    );
  }

  protected get unreadCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  protected onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.searchResults.set(
      query.trim()
        ? this.allResults.filter(r => r.toLowerCase().includes(query.toLowerCase()))
        : []
    );
    this.isSearchOpen.set(query.trim().length > 0);
  }

  protected onSelectResult(result: string) {
    this.searchQuery.set(result);
    this.isSearchOpen.set(false);
    this.searchResults.set([]);
  }

  protected closeSearch() {
    this.isSearchOpen.set(false);
  }
}
