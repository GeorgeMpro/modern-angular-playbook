import {Service, signal} from '@angular/core';

import {AuthServiceContract, ROLE_RANK, UserRoles} from '../shared/models/user-roles.model';

@Service()
export class AuthMock implements AuthServiceContract {

  private readonly _userRole = signal<UserRoles>('viewer');
  userRole = this._userRole.asReadonly();

  hasPermission(requiredRole: UserRoles): boolean {

    return ROLE_RANK[requiredRole] <= ROLE_RANK[this.userRole()];
  }

  setRole(role: UserRoles): void {
    this._userRole.set(role);
  }
}
