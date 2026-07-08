import {Component, inject,} from '@angular/core';

import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppPermission,} from './app-permission';
import {AuthMock} from './auth-mock';

import {USER_ROLES, UserRoleActions,} from '../shared/models/user-roles.model';
import {AUTH_SERVICE} from '../shared/tokens/auth-service.token';

@Component({
  selector: 'app-permission',
  imports: [
    DemoShell,
    AppPermission,
  ],
  providers: [
    {provide: AUTH_SERVICE, useClass: AuthMock}
  ],
  templateUrl: './permission.html',
  styleUrl: './permission.scss',
})
export default class Permission {
  protected readonly roles = USER_ROLES;
  protected readonly rolesAndActions: UserRoleActions[] =
    [
      {role: 'admin', action: 'Delete'},
      {role: 'editor', action: 'Edit'},
      {role: 'viewer', action: 'View'}
    ];

  protected readonly auth = inject(AUTH_SERVICE);
}
