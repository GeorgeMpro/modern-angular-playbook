import {Component, signal} from '@angular/core';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppTypedIf} from '../shared/directives/app-typed-if';

export interface User {
  name: string;
  email: string;
}

export interface Order {
  id: string;
  total: number;
}

const INITIAL_USER: User = {name: 'bob', email: 'bob@mail.com'};
const INITIAL_ORDER: Order = {id: 'ORD-1029', total: 84.5};

@Component({
  selector: 'app-typed-if',
  imports: [
    DemoShell,
    AppTypedIf
  ],
  templateUrl: './typed-if.html',
  styleUrl: './typed-if.scss',
})
export default class TypedIf {

  protected readonly user = signal<User | null>(INITIAL_USER);
  protected readonly order = signal<Order | null>(INITIAL_ORDER);

  protected toggleUser(): void {
    this.user.update(curr => curr ? null : INITIAL_USER);
  }

  protected toggleOrder(): void {
    this.order.update(curr => curr ? null : INITIAL_ORDER);
  }
}
