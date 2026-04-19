import {Injectable} from '@angular/core';

export interface ErrorContext {
  source: string;
  status?: number;
  url?: string;
  method?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorLogger {

  logError(error: Error, context: ErrorContext): void {
    console.group('Error');
    console.error('Message:', error.message);
    console.error('Source:', context.source);
    if (context.status) console.error('Status:', context.status);
    if (context.url) console.error('URL:', context.url);
    if (context.method) console.error('Method:', context.method);
    if (error.stack) console.error('Stack:', error.stack);
    console.groupEnd();
  }
}
