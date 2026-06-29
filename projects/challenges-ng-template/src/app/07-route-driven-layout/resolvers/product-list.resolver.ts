import {ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot} from '@angular/router';

import {Product} from '../../shared/models/product.model';
import {ProductMock} from '../../shared/services/product-mock';
import {inject} from "@angular/core";

export const productsResolver: ResolveFn<Product[]> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const productService = inject(ProductMock);
  return productService.getProducts();
};
