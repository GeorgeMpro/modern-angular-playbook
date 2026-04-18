import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {loginInterceptor} from './interceptors/login-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors(
        [
          loginInterceptor
        ]
      )
    ),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
