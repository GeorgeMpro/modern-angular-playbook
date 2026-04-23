import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {finalize, map, Observable, tap} from 'rxjs';
import {takeUntilDestroyed,} from '@angular/core/rxjs-interop';

import {DemoShell} from '../demo-shell/demo-shell';
import {InfiniteScroll} from '../../directives/infinite-scroll';

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
}

interface ProductResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

const URL = 'https://dummyjson.com/products?limit=5'

@Component({
  selector: 'app-infinte-scroll-demo',
  imports: [
    DemoShell,
    InfiniteScroll
  ],
  templateUrl: './infinite-scroll-demo.component.html',
  styleUrl: './infinite-scroll-demo.component.scss',
})
export class InfiniteScrollDemo implements OnInit {
  private readonly stepsize: number = 5;
  private steps: number = 1;

  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly products$: Observable<Product[]> = this.http.get<ProductResponse>(URL)
    .pipe(
      tap(res => this.productLimit.set(res.total)),
      map(res => res.products));

  protected readonly products = signal<Product[]>([]);
  private readonly productLimit = signal<number>(30);
  private readonly isLoading = signal<boolean>(false);

  ngOnInit() {
    this.products$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: val => this.products.set(val),
      })
  }

  protected onScrollEnd() {
    let isInBounds = this.products().length + this.stepsize <= this.productLimit();
    if (isInBounds && !this.isLoading()) {
      this.isLoading.set(true);
      const url = `${URL}&skip=${this.stepsize * this.steps}`;
      this.steps += 1;
      this.http.get<ProductResponse>(url)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          map(res => res.products),
          finalize(() => this.isLoading.set(false))
        ).subscribe(
        value => {
          this.products.update(v => {
            return [...v, ...value]
          })
        }
      );
    }
  }
}
