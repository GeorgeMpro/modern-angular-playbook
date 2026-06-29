import {Component, computed, inject, input} from '@angular/core';
import {ProductMock} from '../../shared/services/product-mock';

@Component({
  selector: 'app-product-stats',
  imports: [],
  templateUrl: './product-stats.html',
  styleUrl: './product-stats.scss',
})
export class ProductStats {

  private readonly service = inject(ProductMock);

  readonly id = input.required <string>();

  protected readonly product = computed(() => this.service.getProductStats(this.id()));

}
