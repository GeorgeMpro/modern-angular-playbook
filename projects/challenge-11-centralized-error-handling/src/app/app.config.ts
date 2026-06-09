import {ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors, withXhr} from '@angular/common/http';

import {mockBackendInterceptor} from './interceptors/mock-backend-interceptor';
import {errorInterceptor} from './interceptors/error-interceptor';

import {routes} from './app.routes';

import {GlobalErrorHandler} from './services/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXhr(), 
      withInterceptors([
        errorInterceptor,
        mockBackendInterceptor
      ])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {provide: ErrorHandler, useClass: GlobalErrorHandler}
  ]
};
