import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter, TitleStrategy, withComponentInputBinding} from '@angular/router';

import {routes} from './app.routes';
import {PageTitleStrategy} from './shared/title-strategy';
import {provideNavArrowRoutes} from 'ui-theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideNavArrowRoutes(routes, ['home']),
    {provide: TitleStrategy, useExisting: PageTitleStrategy},
  ]
};
