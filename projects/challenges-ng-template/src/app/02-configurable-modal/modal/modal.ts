import {Component, input, model, TemplateRef} from '@angular/core';

import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'app-modal',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  host: {
    'aria-modal': 'true',
    '(window:keydown.escape)': 'closeModal()'
  }
})
export class Modal {

  readonly isOpen = model(false);

  readonly headerTemplate = input.required<TemplateRef<void>>();
  readonly bodyTemplate = input.required<TemplateRef<void>>();
  readonly footerTemplate = input.required<TemplateRef<{ close: () => void }>>();

  readonly closeModal = () => {
    if (this.isOpen()) {
      this.isOpen.set(false)
    }
  };

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.isOpen.set(false);
    }
  }
}
