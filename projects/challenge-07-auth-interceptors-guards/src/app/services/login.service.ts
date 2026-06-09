import {inject, Injectable, InjectionToken, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';
import {KEY, AUTH_URL} from '../tokens/tokens';

@Injectable({
  providedIn: 'root',

})
export class LoginService {

  private readonly key = inject(KEY);
  private readonly url = inject(AUTH_URL);
  private readonly http = inject(HttpClient);

  private readonly isAdmin = signal<boolean>(false);

  login(userName: string, password: string, expiresInMins: number) {
    return this.http.post<{ accessToken: string }>(this.url, {
      username: userName, password: password, expiresInMins: expiresInMins
    })
      .pipe(
        tap(res => localStorage.setItem(this.key, res.accessToken))
      )
  }

  logout(): void {
    localStorage.removeItem(this.key);
  }

  getToken(): string {
    const token = localStorage.getItem(this.key);
    return token ?? '';
  }

  getUserRole(): string {
    return this.isAdmin() ? 'admin' : '';
  }

  toggleAdmin() {
    this.isAdmin.update(val => !val);
  }
}
