import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter, TitleStrategy} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

import {routes} from './app.routes';
import {PageTitleStrategy} from './shared/title-strategy';

import {provideNavArrowRoutes} from 'ui-theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideNavArrowRoutes(routes, ['home']),
    {provide: TitleStrategy, useExisting: PageTitleStrategy},
  ]
};
