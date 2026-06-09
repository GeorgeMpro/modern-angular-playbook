import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {LoginService} from '../services/login.service';

export const roleGuard = (role: string): CanActivateFn => (route, state) => {
  const loginService = inject(LoginService);

  return role === loginService.getUserRole() || inject(Router).createUrlTree(['/forbidden']);
};
