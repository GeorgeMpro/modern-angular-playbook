import {ActivatedRouteSnapshot, CanDeactivateFn, RouterStateSnapshot} from '@angular/router';
import Contact from '../components/contact';


export const unsavedChangesGuard: CanDeactivateFn<Contact> = (
  component: Contact,
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  nextState: RouterStateSnapshot) => {
  return component.hasUnsavedChanges() ?
    confirm('You have unsaved changes. Are you sure you want to leave?') :
    true;
};
