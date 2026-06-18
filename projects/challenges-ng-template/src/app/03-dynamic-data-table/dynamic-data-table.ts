import {Component, inject, signal} from '@angular/core';

import {UserMock} from '../shared/services/user-mock';
import {User} from '../shared/models/user.model';
import {DataTable} from './data-table/data-table';
import {TypedRow} from './data-table/typed-row.directive';
import {ProductMock} from '../shared/services/product-mock';
import {Product} from '../shared/models/product.model';

@Component({
  selector: 'app-dynamic-data-table',
  imports: [
    DataTable,
    TypedRow
  ],
  templateUrl: './dynamic-data-table.html',
  styleUrl: './dynamic-data-table.scss',
})
export default class DynamicDataTable {

  private readonly userService = inject(UserMock);
  private readonly productService = inject(ProductMock);

  protected readonly users = signal<User[]>(
    this.userService.getUsers()
  );
  protected readonly products = signal<Product[]>(
    this.productService.getProducts()
  );
  protected readonly usersHeaders = this.toHeaders(this.users()[0]);
  protected readonly productHeaders = this.toHeaders(
    this.products()[0]
  );

  private toHeaders<T extends object>(item: T): Record<keyof T, string> {
    return Object.fromEntries(
      Object.keys(item).map(k => [k, k])
    ) as Record<keyof T, string>;
  }
}
