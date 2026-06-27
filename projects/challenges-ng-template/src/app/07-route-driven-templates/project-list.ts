import {Component, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';

import {DataTable} from '../03-dynamic-data-table/data-table/data-table';
import {TypedRow} from '../03-dynamic-data-table/data-table/typed-row.directive';
import {ProductMock} from '../shared/services/product-mock';

@Component({
  selector: 'app-project-list',
  imports: [
    RouterLink,
    DataTable,
    TypedRow
  ],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export default class ProjectList {
  protected readonly projectId = signal<string | null>(null);

  private readonly service = inject(ProductMock);

  protected readonly products = signal(this.service.getProducts())
  // TODO dupe code from dynamic data table
  protected readonly productHeaders = this.toHeaders(
    this.products()[0]
  );

  private toHeaders<T extends object>(item: T): Record<keyof T, string> {
    return Object.fromEntries(
      Object.keys(item).map(k => [k, k])
    ) as Record<keyof T, string>;
  }
}
