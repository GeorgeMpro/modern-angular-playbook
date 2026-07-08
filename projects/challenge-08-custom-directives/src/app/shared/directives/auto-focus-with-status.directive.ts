import {Directive, inject} from '@angular/core';

import {AppAutoFocus} from './app-auto-focus';
import {FocusStatus} from './focus-status.directive';

@Directive({
  selector: '[appFocusWithStatus]',
  exportAs: 'focusWithStatus',
  hostDirectives: [
    {directive: AppAutoFocus, inputs: ['shouldFocus']},
    {directive: FocusStatus}
  ]
})
export class AutoFocusWithStatusDirective {
  private readonly focusStatus = inject(FocusStatus);
  readonly indicator = this.focusStatus.indicator;
}
