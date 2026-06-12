import {Component, computed, input} from '@angular/core';
import {TitleCasePipe} from '@angular/common';
import {COLOR_MAP, QueueEntry, QueueEntryAction} from '../shared/models/queue.model';

@Component({
  selector: 'app-queue-entry-table',
  imports: [TitleCasePipe],
  templateUrl: './queue-entry-table.html',
  styleUrl: './queue-entry-table.scss',
  standalone: true
})
export class QueueEntryTable {

  readonly title = input.required<string>();
  readonly items = input.required<QueueEntry[]>();

  readonly actionMap = input.required<Record<QueueEntry['saveStatus'], QueueEntryAction[]>>()

  protected readonly hasAnyActions = computed(() => {
    return this.items().some(
      item => this.actionMap()[item.saveStatus]?.length > 0
    );
  });
  protected readonly COLOR_MAP = COLOR_MAP;
}
