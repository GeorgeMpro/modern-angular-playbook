import {ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot} from '@angular/router';

import {inject} from '@angular/core';

import {Product} from '../shared/models/product.model';
import {ProductMock} from '../shared/services/product-mock';

export const productResolver: ResolveFn<Product> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const productService = inject(ProductMock);
  // todo change to check? alternative?
  const productId = route.paramMap.get('id')!;

  return productService.getProduct(productId);
};
