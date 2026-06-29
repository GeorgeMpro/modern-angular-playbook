import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {Product} from '../../shared/models/product.model';
import {ProductStats} from './product-stats';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ProductStats],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  host: {
    '[class]': 'theme()'
  }
})
export default class ProductDetail {
  readonly id = input.required<string>();
  readonly product = input.required<Product>();
  readonly theme = input<string>();
}
