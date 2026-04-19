export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface ToastMessage {
  id: number,
  content: string,
  status: ToastType,
  duration: number,
  actions: ToastAction[]
}

export type ToastAction = {
  label: string;
  callback: (toast: ToastMessage) => void;
};
