import {Component, computed, inject, signal} from '@angular/core';

import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError, concatMap, delayWhen, EMPTY, Observable, Subject, tap, timer} from 'rxjs';

import {Item, MockApiService} from '../mock/mock-api.service';
import {QueueEntryTable} from './queue-entry-table';
import {SaveResult} from '../shared/models/products.model';

type SaveStatus = 'idle' | 'pending' | 'success' | 'fail';
type ActionStyle = 'primary' | 'danger'

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

@Component({
  selector: 'app-save-queue',
  imports: [
    QueueEntryTable
  ],
  templateUrl: './save-queue.html',
  styleUrl: './save-queue.scss',
  standalone: true
})
export default class SaveQueue {

  private readonly delayMs = 1500;
  private readonly items = signal<QueueEntry[]>([
    {id: 1, category: 'log', saveStatus: 'idle'},
    {id: 2, category: 'warning', saveStatus: 'idle'},
    {id: 3, category: 'error', saveStatus: 'idle'},
    {id: 4, category: 'log', saveStatus: 'idle'},
    {id: 5, category: 'error', saveStatus: 'idle'},
    {id: 6, category: 'warning', saveStatus: 'idle'},
  ]);

  private readonly saveAction: QueueEntryAction = {
    label: 'save',
    callback: (q: QueueEntry) => this.onSaveItem(q),
    style: 'primary',
  };

  private readonly retryAction: QueueEntryAction = {
    label: 'retry',
    callback: (q: QueueEntry) => this.onSaveItem(q),
    style: 'primary'
  };

  private readonly dismissAction: QueueEntryAction = {
    label: 'dismiss',
    callback: (q: QueueEntry) => this.dismissItem(q),
    style: 'danger',
  };

  protected readonly actionMap: Record<QueueEntry['saveStatus'], QueueEntryAction[]> = {
    idle: [this.saveAction],
    pending: [],
    fail: [this.retryAction],
    success: [this.dismissAction]
  }

  private readonly service = inject(MockApiService);

  private readonly itemToSave$ = new Subject<QueueEntry>();

  private readonly itemsSaving$ = this.itemToSave$.pipe(
    concatMap(item => this.handleSave(item)
    )
  );

  private handleSave(item: QueueEntry): Observable<SaveResult> {
    return this.service.saveItem({
      id: item.id, name: String(item.id), category: item.category
    }).pipe(
      // simulate additional delay
      delayWhen(() => timer(Math.random() * this.delayMs)),
      tap(() => this.statusUpdate({...item, saveStatus: 'success'})),
      catchError(() => {
        this.statusUpdate({...item, saveStatus: 'fail'});
        return EMPTY;
      })
    );
  }

  protected readonly itemsSave = computed<QueueEntry[]>(() => {
    return this.items().filter(item => item.saveStatus !== 'pending')
  });
  protected readonly itemsQueue = computed<QueueEntry[]>(() => {
    return this.items().filter(item => item.saveStatus === 'pending');
  })

  constructor() {
    this.itemsSaving$.pipe(
      takeUntilDestroyed()
    )
      .subscribe();
  }

  protected onSaveItem(item: QueueEntry): void {
    this.items.update(curr => {
        return curr.map(
          entry => entry.id === item.id ? {...entry, saveStatus: 'pending'} : {...entry}
        );
      }
    );

    this.itemToSave$.next(item);
  }

  private statusUpdate(item: QueueEntry): void {
    this.items.update(curr => {
      return curr.map(
        entry => entry.id === item.id ? {...item} : {...entry}
      )
    });
  }

  private dismissItem(item: QueueEntry): void {
    this.items.update(curr => {
      return curr.filter(entry => entry.id !== item.id);
    });
  }
}
