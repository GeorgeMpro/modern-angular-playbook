import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';

import {throwError} from 'rxjs';
import {ERROR_DESCRIPTIONS, ERROR_URL} from '../shared/error-descriptions';


export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  // ignore real requests
  if (req.url.startsWith(ERROR_URL)) {
    const code = Number(req.url.split('/').at(-1));
    // handle unknown errors
    if (!(code in ERROR_DESCRIPTIONS)) {
      return next(req);
    }
    return throwError(() => {
      return new HttpErrorResponse({
        status: code,
        statusText: ERROR_DESCRIPTIONS[code],
        url: req.url,
        error: {message: ERROR_DESCRIPTIONS[code]}
      })
    })
  }

  return next(req);
};
