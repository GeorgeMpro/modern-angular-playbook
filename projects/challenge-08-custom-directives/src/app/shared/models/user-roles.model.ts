import {Signal} from '@angular/core';

export type UserRoles = 'admin' | 'editor' | 'viewer';

export const ROLE_RANK: Record<UserRoles, number> = {
  admin: 2,
  editor: 1,
  viewer: 0
}
export const USER_ROLES: readonly UserRoles[] = ['viewer', 'editor', 'admin'];


export interface AuthServiceContract {
  userRole: Signal<UserRoles>;
  hasPermission: (requiredRole: UserRoles) => boolean;
  setRole: (role: UserRoles) => void
}

export interface UserRoleActions {
  role: UserRoles;
  action: string;
}
