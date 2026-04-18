import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {LoginService} from '../services/login.service';

export const authGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const token = loginService.getToken();

  if (token) {
    return true;
  }

  router.navigate(['login']);
  return false;
};
