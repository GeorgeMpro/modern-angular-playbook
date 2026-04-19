import {Component, computed, inject} from '@angular/core';

import {TitleCasePipe} from '@angular/common';
import {ToastService} from '../../services/toast-service';


@Component({
  selector: 'app-toast',
  imports: [
    TitleCasePipe
  ],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = computed(() => this.toastService.toasts());
}
