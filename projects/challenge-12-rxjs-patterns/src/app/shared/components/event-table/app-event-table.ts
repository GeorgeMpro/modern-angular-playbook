import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {AppEvent, CATEGORY_COLORS} from '../../models/event.model';
import {TitleCasePipe} from '@angular/common';
import {TableAction} from '../../models/table.model';

@Component({
  selector: 'app-event-table',
  imports: [
    TitleCasePipe
  ],
  templateUrl: './app-event-table.html',
  styleUrl: './app-event-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppEventTable {

  readonly title = input.required<string>();
  readonly items = input.required<AppEvent[]>();
  readonly actions = input<TableAction<AppEvent>[]>([]);

  protected readonly CATEGORY_COLORS = CATEGORY_COLORS;
}
