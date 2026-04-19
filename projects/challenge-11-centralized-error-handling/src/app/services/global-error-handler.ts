import {ErrorHandler, inject} from '@angular/core';
import {ToastService} from './toast-service';
import {ErrorLogger} from './error-logger';

export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly logger = inject(ErrorLogger);

  handleError(error: unknown): void {
    this.logger.logError(error as Error, {source: 'Global'});

    this.toast.addToast({
      content: `System Error: ${error instanceof Error ? error.message :
        'Unknown'}`,
      status: 'error',
      duration: 8000,
      actions: []
    });

    // 3. Keep standard console log for developers
    console.error('ErrorHandler:', error);
  }
}
