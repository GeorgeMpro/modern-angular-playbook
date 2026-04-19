import {Component, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {catchError, EMPTY, exhaustMap, map, Subject, takeUntil} from 'rxjs';
import {trackRequest} from '../../shared/rxjs-operators';
import {ERROR_DESCRIPTIONS, ERROR_URL, GLOBAL_ERROR_DESCRIPTIONS} from '../../shared/error-descriptions';
import {ToastService} from '../../services/toast-service';

interface DummyError {
  label: string;
  description: string;
  url: string;
}

interface GlobalDummyError {
  label: string;
  callback: () => void;
}

@Component({
  selector: 'app-error-test',
  templateUrl: './error-test.html',
  styleUrl: './error-test.scss'
})
export class ErrorTest {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly errSubj$ = new Subject<DummyError>();
  private readonly cancelSubj$ = new Subject<void>();

  protected readonly isLoading = signal<boolean>(false);

  constructor() {
    this.errSubj$.pipe(
      takeUntilDestroyed(),
      map(err => err.url),
      exhaustMap(url => {
          return this.http.get(url).pipe(
            takeUntil(this.cancelSubj$),
            trackRequest(this.isLoading),
            catchError(err => {
              console.error(`Simulating error: ${err.status}`);
              return EMPTY;
            })
          );
        }
      )
    ).subscribe();
  }

  protected readonly errors: DummyError[] = Object.entries(ERROR_DESCRIPTIONS).map(
    ([code, description]) => ({
      label: code,
      description: description,
      url: `${ERROR_URL}/${code}`
    })
  );
  protected readonly globalErrors: GlobalDummyError[] = Object.entries(GLOBAL_ERROR_DESCRIPTIONS)
    .map(([label, callback]) => ({
      label: label,
      callback: callback,
    }));


  protected simulateError(err: DummyError) {
    this.errSubj$.next(err);
  }

  protected onCancel() {
    console.warn('Request Canceled.');
    this.toastService.addToast({
      content: 'Request retry canceled.',
      status: 'info',
      actions: [],
      duration: 5000,
    });
    this.cancelSubj$.next();
  }
}
