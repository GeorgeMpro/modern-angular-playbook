import {CanDeactivateFn} from '@angular/router';

import ExitConfirm from '../../18-exit-confirm/exit-confirm';

export const exitConfirmGuard: CanDeactivateFn<ExitConfirm> = (component) => {
  return component.isDirty()
    ? confirm('Are you sure you want to leave?')
    : true;
};

