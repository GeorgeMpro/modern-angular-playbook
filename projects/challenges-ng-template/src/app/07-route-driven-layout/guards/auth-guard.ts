import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';

import {Auth} from '../services/auth';

export function authGuard(redirectTo = '/'): CanActivateFn {
  return (route, state) => {
    const service = inject(Auth);
    const router = inject(Router);
    if (service.isLoggedIn()) return true;
    return router.createUrlTree([redirectTo]);
  }
}
