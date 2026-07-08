import {InjectionToken} from '@angular/core';

import {AuthServiceContract} from '../models/user-roles.model';

export const AUTH_SERVICE = new InjectionToken<AuthServiceContract>('AUTH_SERVICE');
