import {CanActivateFn} from '@angular/router';
import {inject} from '@angular/core';
import {Auth} from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const service = inject(Auth);
  return service.isLoggedIn();
};
