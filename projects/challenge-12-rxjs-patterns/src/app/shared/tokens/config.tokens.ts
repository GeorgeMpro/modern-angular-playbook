import {InjectionToken} from '@angular/core';

export interface AppConfig {
  productsApiUrl: string,
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({
    productsApiUrl: 'https://dummyjson.com/products',
  })
})
