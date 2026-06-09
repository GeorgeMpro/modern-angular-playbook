import {Injectable, signal} from '@angular/core';
import {ToastAction, ToastMessage, ToastType} from '../shared/toast.model';


@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly dismissAction: ToastAction = {
    label: 'dismiss',
    callback: (t: ToastMessage) => this.dismissToast(t)
  };
  private readonly retryAction: ToastAction = {
    label: 'retry',
    callback: (t: ToastMessage) => {
      this.dismissToast(t);
      this.addToast({...t});
      console.warn(`Retrying: ${t.content}`)
    }
  }
  private readonly undoAction: ToastAction = {
    label: 'undo',
    callback: (t: ToastMessage) => {
      console.warn(`Undoing: ${t.content}`);
      this.dismissToast(t);

      this.addToast({...t, content: `(Rolled Back) ${t.content}`, status: 'info'})
    }
  };

  private readonly STATUS_ACTIONS: Record<ToastType, ToastAction[]> = {
    error: [this.retryAction, this.dismissAction],
    info: [this.dismissAction],
    success: [this.undoAction, this.dismissAction],
    warning: [this.dismissAction],
  };
  private readonly dummyMessages: ToastMessage[] = [
    {
      id: 1, content: 'Error!', status: 'error', duration: 30000, actions: []
    },
    {id: 2, content: 'Warning!!', status: 'warning', duration: 15000, actions: []},
    {id: 3, content: 'Success!', status: 'success', duration: 15000, actions: []},
    {id: 4, content: 'Info!', status: 'info', duration: 15000, actions: []},
    {id: 5, content: 'System Error', status: 'error', duration: 30000, actions: []},
    {id: 6, content: 'Unknown Error', status: 'error', duration: 30000, actions: []},
    {id: 7, content: 'Another Success!', status: 'success', duration: 30000, actions: []},
    {id: 8, content: 'Complete', status: 'success', duration: 30000, actions: []},
  ];
  private idCounter: number = 1;
  private readonly _toasts = signal<ToastMessage[]>([]);
  private readonly _timers = new Map<number, ReturnType<typeof setTimeout>>
  readonly toasts = this._toasts.asReadonly();


  constructor() {
    this.dummyMessages.forEach(t => this.addToast(t));
  }

  public addToast(toast: Omit<ToastMessage, 'id'>): void {
    const t = this.appendToastActions({...toast, id: this.idCounter++})
    this._toasts.update(
      toasts => [...toasts, t]
    );
    this._timers.set(t.id, setTimeout(
      () => this.dismissToast(t), toast.duration
    ));
  }

  private appendToastActions(toast: ToastMessage): ToastMessage {
    return {...toast, actions: this.STATUS_ACTIONS[toast.status]}
  }

  public dismissToast(toast: ToastMessage) {
    this.handleTimeout(toast);
    this._toasts.update(
      toasts => toasts.filter(
        t => t.id !== toast.id
      )
    );
  }

  private handleTimeout(toast: ToastMessage) {
    clearTimeout(this._timers.get(toast.id))
    this._timers.delete(toast.id);
  }
}

