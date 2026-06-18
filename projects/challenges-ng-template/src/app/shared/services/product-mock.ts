import {Service} from '@angular/core';

import {Product} from '../models/product.model';

@Service()
export class ProductMock {
  readonly products: Product[] = [
    {
      id: 1, name: 'Wireless Keyboard', brand: 'Logitech', category: 'Peripherals',
      price: 49.99, stock: 120
    },
    {
      id: 2, name: 'Mechanical Mouse', brand: 'Razer', category: 'Peripherals', price:
        34.99, stock: 85
    },
    {
      id: 3, name: 'USB-C Hub', brand: 'Anker', category: 'Accessories', price: 29.99,
      stock: 200
    },
    {
      id: 4, name: '27" Monitor', brand: 'Samsung', category: 'Displays', price: 299.99,
      stock: 30
    },
    {
      id: 5, name: 'Laptop Stand', brand: 'Rain Design', category: 'Accessories', price:
        24.99, stock: 150
    },
    {
      id: 6, name: 'Webcam HD', brand: 'Logitech', category: 'Peripherals', price: 79.99,
      stock: 60
    },
    {
      id: 7, name: 'Desk Lamp', brand: 'BenQ', category: 'Lighting', price: 39.99, stock:
        95
    },
    {
      id: 8, name: 'Cable Organizer', brand: 'Bluelounge', category: 'Accessories',
      price: 12.99, stock: 300
    },
  ];

  public getProducts(): Product[] {
    return this.products;
  }
}
