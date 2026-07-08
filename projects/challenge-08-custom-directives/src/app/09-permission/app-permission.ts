import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import {UserRoles} from '../shared/models/user-roles.model';
import {AUTH_SERVICE} from '../shared/tokens/auth-service.token';

@Directive({
  selector: '[appPermission]',
})
export class AppPermission {

  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AUTH_SERVICE);

  readonly appPermission = input.required<UserRoles>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.auth.hasPermission(this.appPermission())) {
        this.vcr.createEmbeddedView(this.templateRef);
      }
    });
  }
}
