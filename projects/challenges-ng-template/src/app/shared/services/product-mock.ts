import {Service} from '@angular/core';

import {Product, ProductStats} from '../models/product.model';

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

  private readonly stats: Record<number, ProductStats> = {
    1: {rating: 4.5, reviewCount: 312, returnRate: 3, soldLastMonth: 540},
    2: {rating: 4.2, reviewCount: 198, returnRate: 5, soldLastMonth: 320},
    3: {rating: 4.7, reviewCount: 451, returnRate: 2, soldLastMonth: 780},
    4: {rating: 4.3, reviewCount: 87, returnRate: 4, soldLastMonth: 95},
    5: {rating: 4.6, reviewCount: 263, returnRate: 1, soldLastMonth: 410},
    6: {rating: 4.1, reviewCount: 174, returnRate: 6, soldLastMonth: 230},
    7: {rating: 4.4, reviewCount: 329, returnRate: 3, soldLastMonth: 290},
    8: {rating: 4.8, reviewCount: 512, returnRate: 2, soldLastMonth: 670},
  };

  public getProducts(): Product[] {
    return this.products;
  }

  public getProduct(id: string): Product {
    const productId = Number(id);
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product ${id} not found`)
    }

    return product;
  }


  public getProductStats(id: string): ProductStats {
    const productId = Number(id);
    const stats = this.stats[productId];
    if (!stats) throw new Error(`Stats for product ${id} not found`);
    return stats;
  }
}
