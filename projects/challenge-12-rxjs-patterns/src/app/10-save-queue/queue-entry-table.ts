import {Component, input, output} from '@angular/core';
import {TitleCasePipe} from '@angular/common';
import {COLOR_MAP, QueueEntry} from './save-queue';

@Component({
  selector: 'app-queue-entry-table',
  imports: [TitleCasePipe],
  templateUrl: './queue-entry-table.html',
  styleUrl: './queue-entry-table.scss',
  standalone: true
})
export class QueueEntryTable {

  readonly title = input.required<string>();
  readonly hasActions = input(true);
  readonly items = input.required<QueueEntry[]>();
  readonly saved = output<QueueEntry>();


  protected onSaveItem(item: QueueEntry) {
    this.saved.emit(item)
  }

  protected readonly COLOR_MAP = COLOR_MAP;
}
