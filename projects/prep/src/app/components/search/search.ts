import {Component, inject, Signal, signal, ChangeDetectionStrategy} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {catchError, debounceTime, distinctUntilChanged, finalize, map, Observable, of, switchMap, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';

interface User {
  id: number,
  firstName: string,
  lastName: string,
  maidenName: string,
  age: number,
  gender: string,
  email: string,
  phone: string,
  username: string,
  password: string,
  birthDate: string,
  image: string,
  bloodGroup: string,
  height: number,
  weight: string,
  eyeColor: string,
  hair: {
    color: string,
    type: string,
  },
}

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  images: string[];
  thumbnail: string;
}

@Component({
  selector: 'app-search',
  imports: [
    FormsModule
  ],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search.scss',
})
export class Search {
  private readonly http = inject(HttpClient);

  protected readonly query = signal<string>('');
  private readonly query$ = toObservable(this.query);
  private readonly queryDelay$ = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(_ => this.isLoading.set(true)),
    switchMap(query => this.http.get<{ users: User[] }>(`https://dummyjson.com/users/search?q=${query}`)
      .pipe(
        map(res => res.users),
        catchError((err): Observable<User[]> => {
            console.error(err);
            return of([]);
          }
        ),
        finalize(() => this.isLoading.set(false)
        ))));

  protected readonly isLoading = signal<boolean>(false);


  protected readonly results: Signal<User[]> = toSignal(this.queryDelay$, {
    initialValue: []
  });

  private readonly products$: Observable<Product[]> = this.http.get<{
    products: Product[]
  }>('https://dummyjson.com/products')
    .pipe(
      map(res => res.products)
    )
  protected readonly products = toSignal(
    this.products$,
    {initialValue: []}
  );
}
