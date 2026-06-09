import {HttpErrorResponse, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';

import {catchError, throwError} from 'rxjs';
import {ErrorLogger} from '../services/error-logger';

import {retryOnNetworkError} from '../shared/rxjs-operators';
import {ToastService} from '../services/toast-service';
import {ToastMessage} from '../shared/toast.model';

import {ERROR_DESCRIPTIONS, USER_ERROR_MESSAGES} from '../shared/error-descriptions';


function logError(loggerService: ErrorLogger, error: HttpErrorResponse, req: HttpRequest<unknown>) {
  loggerService.logError(new Error(error.message), {
    source: 'HttpErrorInterceptor',
    status: error.status,
    url: error.url ?? req.url,
    method: req.method,
  });
}

function addToast(error: HttpErrorResponse, toastService: ToastService) {
  const message = USER_ERROR_MESSAGES[error.status] ?? `Unexpected error ${error.status}`
  const toast: ToastMessage = {
    id: Date.now(),
    content: message,
    duration: 50000,
    status: "error",
    actions: []
  };
  toastService.addToast(toast);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const loggerService = inject(ErrorLogger);
  const toastService = inject(ToastService);

  return next(req).pipe(
    retryOnNetworkError(
      (count, max) => toastService.addToast({
        content: `Retrying... (${count}/${max})`,
        status: 'info',
        duration: 5000,
        actions: []
      })
    ),
    catchError((error: HttpErrorResponse) => {
      logError(loggerService, error, req);
      addToast(error, toastService);

      return throwError(() => error);
    })
  );
};
