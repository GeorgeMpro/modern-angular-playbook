import {Component, inject} from '@angular/core';
import {Auth} from '../services/auth';
import {ProductMock} from '../../shared/services/product-mock';

interface Stat {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export default class Admin {
  protected readonly isLoggedIn = inject(Auth).isLoggedIn;

  private readonly products = inject(ProductMock).getProducts();

  protected readonly stats: Stat[] = [
    {label: 'Products', value: this.products.length},
    {label: 'Categories', value: new Set(this.products.map(p => p.category)).size},
    {label: 'Units in Stock', value: this.products.reduce((sum, p) => sum + p.stock, 0)},
  ];
}
