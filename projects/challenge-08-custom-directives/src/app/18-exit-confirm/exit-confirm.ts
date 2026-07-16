import {Component, computed, signal} from '@angular/core';

import {form, FormField} from '@angular/forms/signals';

import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppExitConfirm} from '../shared/directives/app-exit-confirm';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-exit-confirm',
  imports: [
    DemoShell,
    FormField,
    AppExitConfirm
  ],
  templateUrl: './exit-confirm.html',
  styleUrl: './exit-confirm.scss',
})
export default class ExitConfirm {
  private readonly initialUser = {
    email: '', password: '',
  }
  private readonly loginModel = signal<LoginData>(this.initialUser);

  protected readonly loginForm = form(this.loginModel);

  readonly isDirty = computed(() => this.loginForm().dirty());

  protected resetForm() {
    this.loginForm().reset(this.initialUser);
  }
}
