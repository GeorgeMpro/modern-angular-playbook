import {Component, signal} from '@angular/core';
import {TitleCasePipe} from '@angular/common';

import {delay, Observable, of, throwError} from 'rxjs';

import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppAsync} from '../shared/directives/app-async';

export interface User {
  id: number;
  name: string;
}

const USERS: User[] = [
  {id: 1, name: 'bob'},
  {id: 2, name: 'alice'},
];

function fetchUsers(): Observable<User[]> {
  return of(USERS).pipe(delay(1500));
}

function fetchUsersError(): Observable<User[]> {
  return throwError(() => new Error('Failed to load users')).pipe(delay(1500));
}

@Component({
  selector: 'app-async',
  imports: [
    DemoShell,
    AppAsync,
    TitleCasePipe
  ],
  templateUrl: './async.html',
  styleUrl: './async.scss',
})
export default class Async {

  protected readonly usersSource = signal<Observable<User[]>>(fetchUsers());

  protected reload(): void {
    this.usersSource.set(fetchUsers());
  }

  protected simulateError(): void {
    this.usersSource.set(fetchUsersError());
  }
}
