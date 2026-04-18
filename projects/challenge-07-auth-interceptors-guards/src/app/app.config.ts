import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {loginInterceptor} from './interceptors/login-interceptor';
import {KEY, AUTH_URL} from './tokens/tokens';

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
    provideRouter(routes),
    {
      provide: AUTH_URL, useValue: 'https://dummyjson.com/auth/login'
    }, {
      provide: KEY, useValue: 'challenge_7_token'
    }
  ]
};
