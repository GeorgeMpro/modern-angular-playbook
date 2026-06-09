import {Component, inject, ChangeDetectionStrategy} from '@angular/core';

import {TitleCasePipe} from '@angular/common';
import {ToastService} from '../../services/toast-service';


@Component({
  selector: 'app-toast',
  imports: [
    TitleCasePipe
  ],
  templateUrl: './toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './toast.scss',
})
export class Toast {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;
}
