import {HttpInterceptorFn} from '@angular/common/http';
import { LoginService} from '../services/login.service';
import { inject } from "@angular/core";

export const loginInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken();
  if (!token) {
    return next(req);
  }
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
