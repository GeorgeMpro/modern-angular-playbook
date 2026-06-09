import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';

import {LoginService} from '../../services/login.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.scss',
})
export class Login {

  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  protected readonly token = signal<string>('');

  protected onLogin(
    userName: string = 'emilys',
    password: string = 'emilyspass',
    expiresInMins: number = 30) {
    this.loginService.login(
      userName,
      password,
      expiresInMins)
      .subscribe({
        next: (response) => {
          this.token.set(response.accessToken)
          this.router.navigate(['dashboard']);
        },
        error: (err) => console.error(err),
      });
  }

  protected logout() {
    this.token.set('');
    this.loginService.logout();
  }
}
