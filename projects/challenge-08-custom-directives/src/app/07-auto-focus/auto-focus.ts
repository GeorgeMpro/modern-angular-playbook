import {Component, signal} from '@angular/core';

import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AutoFocusWithStatusDirective} from '../shared/directives/auto-focus-with-status.directive';
import {FocusHarness} from './focus-harness';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'app-auto-focus',
  imports: [
    DemoShell,
    FocusHarness,
    AutoFocusWithStatusDirective,
    NgTemplateOutlet
  ],
  templateUrl: './auto-focus.html',
  styleUrl: './auto-focus.scss',
})
export default class AutoFocus {
  protected readonly isRenaming = signal(false);
}
