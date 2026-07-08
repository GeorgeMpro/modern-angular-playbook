import {Component, input, TemplateRef} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'app-focus-harness',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './focus-harness.html',
  styleUrl: 'focus-harness.scss',
})
export class FocusHarness {
  readonly label = input.required<string>();
  readonly content = input.required<TemplateRef<unknown>>();
}
