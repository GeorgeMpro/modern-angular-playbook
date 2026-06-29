import {Component, computed, input,} from '@angular/core';
import {RouterLink} from '@angular/router';

import {DataTable} from '../../03-dynamic-data-table/data-table/data-table';
import {TypedRow} from '../../03-dynamic-data-table/data-table/typed-row.directive';
import {Product} from '../../shared/models/product.model';

@Component({
  selector: 'app-product-list',
  imports: [
    RouterLink,
    DataTable,
    TypedRow
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export default class ProductList {

  protected readonly products = input.required<Product[]>();

  protected readonly productHeaders = computed(() =>
    this.toHeaders(this.products()[0]));

  private toHeaders<T extends object>(item: T): Record<keyof T, string> {
    return Object.fromEntries(
      Object.keys(item).map(k => [k, k])
    ) as Record<keyof T, string>;
  }
}
