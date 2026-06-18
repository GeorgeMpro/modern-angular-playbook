import {Component, signal} from '@angular/core';
import {Modal} from './modal/modal';

@Component({
  selector: 'app-configurable-modal',
  imports: [
    Modal
  ],
  templateUrl: './configurable-modal.html',
  styleUrl: './configurable-modal.scss',
})
export default class ConfigurableModal {

  protected readonly isDeleteModalOpen = signal(false);

  protected readonly isLoginModalOpen = signal(false);
}
