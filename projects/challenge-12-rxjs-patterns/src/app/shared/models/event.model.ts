// Notice: Assumed AppEvent interface in mock-api is backend model
import {Item} from '../../mock/mock-api.service';

export interface AppEvent {
  type: 'log' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export type EventType = AppEvent['type'];

export type Status = 'pending' | 'success' | 'error';

export interface ErrorState {
  event: AppEvent,
  status: Status;
}

export const CATEGORY_COLORS: Record<Item['category'], string> = {
  log: '#87CEEB',
  error: '#d52a2a',
  warning: '#f3741d'
}

export const STATUS_COLORS: Record<Status, string> = {
  pending: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
}

