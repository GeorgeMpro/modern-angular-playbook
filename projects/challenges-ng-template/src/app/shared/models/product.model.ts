export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
}

export interface ProductStats {
  rating: number;
  reviewCount: number;
  returnRate: number;
  soldLastMonth: number;
}
