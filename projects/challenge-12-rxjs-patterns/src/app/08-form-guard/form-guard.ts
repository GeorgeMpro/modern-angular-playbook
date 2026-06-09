import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {TitleCasePipe} from '@angular/common';
import {form, FormField} from '@angular/forms/signals';

import {toSignal} from '@angular/core/rxjs-interop';
import {
  catchError,
  exhaustMap,
  of,
  scan,
  map,
  Subject,
  tap, Observable, defer, finalize,
} from 'rxjs';

import {MockApiService} from '../mock/mock-api.service';
import {retryWithBackoff, withLoading} from '../shared/operators/operators';

export interface UserCredentials {
  username: string;
  nickname: string;
}

type SaveStatus = 'success' | 'fail' | 'initial';


@Component({
  selector: 'app-form-guard',
  imports: [
    FormField,
    TitleCasePipe
  ],
  templateUrl: './form-guard.html',
  styleUrl: './form-guard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FormGuard {

  protected readonly maxRetries = 3;
  private readonly baseDelayMs = 300;

  private readonly service = inject(MockApiService);
  private readonly formModel = signal<UserCredentials>({
    username: '',
    nickname: ''
  });
  protected readonly isLoading = signal(false);
  protected readonly saveStatus = signal<SaveStatus>('initial');
  protected readonly retryAttempt = signal(0);

  protected readonly userForm = form(this.formModel);

  private readonly userUpdate$ = new Subject<void>();
  private readonly profileSave$ = this.userUpdate$.pipe(
    exhaustMap(() => {
      const username = this.userForm.username().value();
      const nickname = this.userForm.nickname().value();

      return defer(() => this.service.saveUser(username)).pipe(
        retryWithBackoff(
          this.maxRetries,
          this.baseDelayMs,
          count => this.retryAttempt.set(count)),
        tap(() => this.saveStatus.set('success')),
        map(() => ({username, nickname})),
        catchError(() => this.handleSaveError()),
        withLoading(this.isLoading),
        finalize(() => this.retryAttempt.set(0))
      );
    }),
  );

  private handleSaveError(): Observable<UserCredentials> {
    this.saveStatus.set('fail');
    return of(this.userCredentials());
  }

  private readonly ignoredClicksFlag$ = this.userUpdate$.pipe(
    map(() => this.isLoading() ? 1 : 0),
  );
  private readonly currentIgnoredCounter$ = this.ignoredClicksFlag$.pipe(
    scan((acc, curr) => curr === 0 ? 0 : acc + 1, 0)
  );
  private readonly totalIgnoredCounter$ = this.ignoredClicksFlag$.pipe(
    scan((acc, curr) => acc + curr, 0)
  );
  protected readonly totalIgnoredCounter = toSignal(this.totalIgnoredCounter$, {initialValue: 0});
  protected readonly currentIgnoredCounter = toSignal(this.currentIgnoredCounter$, {initialValue: 0});

  protected readonly userCredentials = toSignal(this.profileSave$, {
    initialValue: {username: '', nickname: ''}
  });

  protected onSubmit(event: Event) {
    event.preventDefault();
    this.userUpdate$.next();
  }
}
