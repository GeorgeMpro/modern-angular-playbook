import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';

export const KEY = 'challenge_7_token';
const url = 'https://dummyjson.com/auth/login'

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  private readonly http = inject(HttpClient);

  login(userName: string, password: string, expiresInMins: number) {
    return this.http.post<{ accessToken: string }>(url, {
      username: userName, password: password, expiresInMins: expiresInMins
    })
      .pipe(
        tap(res => localStorage.setItem(KEY, res.accessToken))
      )
  }

  logout(): void {
    localStorage.removeItem(KEY);
  }

  getToken(): string {
    const token = localStorage.getItem(KEY);
    return token ?? '';
  }

  getUerRole() {
    return 'admin';
  }
}
