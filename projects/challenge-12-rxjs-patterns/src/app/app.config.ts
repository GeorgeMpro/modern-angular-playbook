import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter, TitleStrategy} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withXhr} from '@angular/common/http';
import {PageTitleStrategy} from './shared/title-strategy';
import {provideNavArrowRoutes} from 'ui-theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXhr()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNavArrowRoutes(routes, ['home']),
    {provide: TitleStrategy, useExisting: PageTitleStrategy},
  ]
};
