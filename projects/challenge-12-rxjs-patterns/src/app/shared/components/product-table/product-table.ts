import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Product} from "../../models/products.model";
import {CurrencyPipe} from '@angular/common';

@Component({
  selector: 'app-product-table',
  imports: [
    CurrencyPipe
  ],
  templateUrl: './product-table.html',
  styleUrl: './product-table.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTable {

  protected readonly colSpan = 6;
  readonly products = input.required<Product[]>();
  readonly isLoading = input.required<boolean>();
  readonly hasSearchTerm = input<boolean>(false);
}
