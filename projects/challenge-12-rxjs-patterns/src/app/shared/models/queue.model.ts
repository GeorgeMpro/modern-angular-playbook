import {Item} from '../../mock/mock-api.service';

export type SaveStatus = 'idle' | 'pending' | 'success' | 'fail';
export type ActionStyle = 'primary' | 'danger';

export interface QueueEntry {
  id: number;
  category: Item['category'];
  saveStatus: SaveStatus;
}

export interface QueueEntryAction {
  label: string;
  callback: (q: QueueEntry) => void;
  style?: ActionStyle;
}

export const COLOR_MAP: Record<SaveStatus, string> = {
  idle: '#3b82f6',
  pending: '#f59e0b',
  success: '#10b981',
  fail: '#ef4444',
};
