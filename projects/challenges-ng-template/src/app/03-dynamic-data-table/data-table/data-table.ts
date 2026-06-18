import {Component, input, TemplateRef} from '@angular/core';
import {KeyValuePipe, NgTemplateOutlet, TitleCasePipe} from '@angular/common';

@Component({
  selector: 'app-data-table',
  imports: [
    TitleCasePipe,
    KeyValuePipe,
    NgTemplateOutlet
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable<T> {
  readonly title = input.required<string>();
  readonly columnHeaders = input.required<Record<keyof T, string>>();
  readonly data = input.required<T[]>();
  readonly rowTemplate = input.required<TemplateRef<{ $implicit: T; index: number }>>();
}
