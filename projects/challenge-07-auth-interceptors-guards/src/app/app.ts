import {Component, inject, signal} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {LoginService} from './services/login.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly loginService = inject(LoginService);

  protected readonly title = signal('challenge-07-auth-interceptors-guards');

  toggleAdmin(): void {
    this.loginService.toggleAdmin();
  }
}
