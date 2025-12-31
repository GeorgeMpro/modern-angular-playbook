# Challenge #9: Testing Patterns - Real Component/Service Tests

**Difficulty:** Medium
**Time Estimate:** 3-4 hours
**Focus:** Practical testing you'll actually use at work

---

## 🎯 Learning Objectives

- Write component tests (shallow vs deep)
- Mock services and HTTP calls
- Test user interactions (clicks, inputs)
- Test async code (Observables, Promises)
- Test signals and computed values
- Use test fixtures and data builders
- Achieve meaningful test coverage
- Learn Vitest (Angular 21 default) and Jasmine/Karma

---

## 📋 The Challenge

Write **real tests** for these scenarios:

### 1. Component Tests
- Component with inputs/outputs
- Component with services
- Component with forms
- Component with async data
- Component with signals

### 2. Service Tests
- HTTP service with mocking
- State management service
- Auth service with localStorage

### 3. Directive Tests
- Attribute directive behavior
- Structural directive rendering

### 4. Pipe Tests
- Pure pipe transformations
- Impure pipe with async

### 5. Integration Tests
- Multiple components working together
- Route navigation
- Form submission flow

---

## 🏗️ Testing Setup

### Vitest Setup (Angular 21 Default)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts'
      ]
    }
  }
});
```

```typescript
// src/test-setup.ts
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
```

---

## 📝 Pattern #1: Component with Inputs/Outputs

```typescript
// product-card.component.ts
@Component({
  selector: 'app-product-card',
  standalone: true,
  template: `
    <div class="product-card">
      <h3>{{ product.name }}</h3>
      <p>{{ product.price | currency }}</p>
      <button (click)="onAddToCart()">Add to Cart</button>
    </div>
  `
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
```

**Test:**
```typescript
// product-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';
import { Product } from './product.model';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display product name and price', () => {
    // Arrange
    const mockProduct: Product = {
      id: 1,
      name: 'Test Product',
      price: 99.99
    };
    component.product = mockProduct;

    // Act
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h3').textContent).toContain('Test Product');
    expect(compiled.querySelector('p').textContent).toContain('$99.99');
  });

  it('should emit addToCart event when button clicked', () => {
    // Arrange
    const mockProduct: Product = { id: 1, name: 'Test', price: 50 };
    component.product = mockProduct;

    spyOn(component.addToCart, 'emit');

    fixture.detectChanges();

    // Act
    const button = fixture.nativeElement.querySelector('button');
    button.click();

    // Assert
    expect(component.addToCart.emit).toHaveBeenCalledWith(mockProduct);
  });
});
```

---

## 📝 Pattern #2: Component with Service (Mocking)

```typescript
// product-list.component.ts
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div *ngIf="loading">Loading...</div>
    <div *ngIf="error">{{ error }}</div>

    <div class="product-grid">
      <app-product-card
        *ngFor="let product of products"
        [product]="product"
        (addToCart)="handleAddToCart($event)">
      </app-product-card>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products';
        this.loading = false;
      }
    });
  }

  handleAddToCart(product: Product): void {
    console.log('Added to cart:', product);
  }
}
```

**Test with Mock Service:**
```typescript
// product-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from './product.service';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;

  beforeEach(async () => {
    // Create mock service
    mockProductService = jasmine.createSpyObj('ProductService', ['getProducts']);

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: mockProductService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should load products on init', () => {
    // Arrange
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 10 },
      { id: 2, name: 'Product 2', price: 20 }
    ];
    mockProductService.getProducts.and.returnValue(of(mockProducts));

    // Act
    fixture.detectChanges(); // Triggers ngOnInit

    // Assert
    expect(component.products).toEqual(mockProducts);
    expect(component.loading).toBe(false);
    expect(mockProductService.getProducts).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    // Arrange
    mockProductService.getProducts.and.returnValue(of([]));

    // Act - before detectChanges
    component.loading = true;
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Loading...');
  });

  it('should handle error when loading fails', () => {
    // Arrange
    mockProductService.getProducts.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.error).toBe('Failed to load products');
    expect(component.loading).toBe(false);
  });
});
```

---

## 📝 Pattern #3: Testing Forms

```typescript
// login.component.ts
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="email" type="email" />
      <div *ngIf="email.invalid && email.touched">
        Email is required
      </div>

      <input formControlName="password" type="password" />
      <div *ngIf="password.invalid && password.touched">
        Password must be at least 6 characters
      </div>

      <button type="submit" [disabled]="loginForm.invalid">Login</button>
    </form>
  `
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Form submitted:', this.loginForm.value);
    }
  }
}
```

**Test:**
```typescript
// login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: ''
    });
  });

  it('should invalidate form when email is invalid', () => {
    component.email.setValue('invalid-email');
    expect(component.email.valid).toBe(false);
    expect(component.email.hasError('email')).toBe(true);
  });

  it('should invalidate form when password is too short', () => {
    component.password.setValue('123');
    expect(component.password.valid).toBe(false);
    expect(component.password.hasError('minlength')).toBe(true);
  });

  it('should validate form when inputs are valid', () => {
    component.email.setValue('test@test.com');
    component.password.setValue('password123');

    expect(component.loginForm.valid).toBe(true);
  });

  it('should disable submit button when form invalid', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);

    component.email.setValue('test@test.com');
    component.password.setValue('password123');
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
  });

  it('should call onSubmit when form submitted', () => {
    spyOn(component, 'onSubmit');

    component.email.setValue('test@test.com');
    component.password.setValue('password123');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    expect(component.onSubmit).toHaveBeenCalled();
  });
});
```

---

## 📝 Pattern #4: Testing Signals

```typescript
// counter.component.ts
@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Double: {{ double() }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);

  increment(): void {
    this.count.update(c => c + 1);
  }

  decrement(): void {
    this.count.update(c => c - 1);
  }

  reset(): void {
    this.count.set(0);
  }
}
```

**Test:**
```typescript
// counter.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize count to 0', () => {
    expect(component.count()).toBe(0);
  });

  it('should compute double value', () => {
    component.count.set(5);
    expect(component.double()).toBe(10);
  });

  it('should increment count', () => {
    component.increment();
    expect(component.count()).toBe(1);

    component.increment();
    expect(component.count()).toBe(2);
  });

  it('should decrement count', () => {
    component.count.set(5);
    component.decrement();
    expect(component.count()).toBe(4);
  });

  it('should reset count to 0', () => {
    component.count.set(10);
    component.reset();
    expect(component.count()).toBe(0);
  });

  it('should update UI when count changes', () => {
    component.increment();
    fixture.detectChanges();

    const p = fixture.nativeElement.querySelector('p');
    expect(p.textContent).toContain('Count: 1');
  });

  it('should update double when count changes', () => {
    component.count.set(5);
    fixture.detectChanges();

    const paragraphs = fixture.nativeElement.querySelectorAll('p');
    expect(paragraphs[1].textContent).toContain('Double: 10');
  });
});
```

---

## 📝 Pattern #5: Testing HTTP Service

```typescript
// product.service.ts
@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'https://api.example.com/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Test with HttpClientTestingModule:**
```typescript
// product.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from './product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify no outstanding requests
    httpMock.verify();
  });

  it('should fetch products', () => {
    const mockProducts: Product[] = [
      { id: 1, name: 'Product 1', price: 10 },
      { id: 2, name: 'Product 2', price: 20 }
    ];

    service.getProducts().subscribe(products => {
      expect(products).toEqual(mockProducts);
      expect(products.length).toBe(2);
    });

    const req = httpMock.expectOne('https://api.example.com/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('should fetch single product', () => {
    const mockProduct: Product = { id: 1, name: 'Product 1', price: 10 };

    service.getProduct(1).subscribe(product => {
      expect(product).toEqual(mockProduct);
    });

    const req = httpMock.expectOne('https://api.example.com/products/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);
  });

  it('should create product', () => {
    const newProduct: Product = { id: 0, name: 'New Product', price: 30 };
    const createdProduct: Product = { ...newProduct, id: 3 };

    service.createProduct(newProduct).subscribe(product => {
      expect(product).toEqual(createdProduct);
    });

    const req = httpMock.expectOne('https://api.example.com/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProduct);
    req.flush(createdProduct);
  });

  it('should handle error', () => {
    const errorMessage = 'Server error';

    service.getProducts().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne('https://api.example.com/products');
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});
```

---

## 📝 Pattern #6: Test Data Builders

```typescript
// test-helpers/product-builder.ts
export class ProductBuilder {
  private product: Product = {
    id: 1,
    name: 'Default Product',
    price: 100,
    category: 'Electronics',
    inStock: true
  };

  withId(id: number): this {
    this.product.id = id;
    return this;
  }

  withName(name: string): this {
    this.product.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.product.price = price;
    return this;
  }

  outOfStock(): this {
    this.product.inStock = false;
    return this;
  }

  build(): Product {
    return { ...this.product };
  }
}

// Usage in tests:
const product = new ProductBuilder()
  .withId(5)
  .withName('Laptop')
  .withPrice(999)
  .build();

const outOfStockProduct = new ProductBuilder()
  .outOfStock()
  .build();
```

---

## 📝 Pattern #7: Testing Async with fakeAsync

```typescript
it('should debounce search input', fakeAsync(() => {
  component.searchControl.setValue('ang');
  tick(100); // 100ms passed
  expect(mockService.search).not.toHaveBeenCalled();

  tick(200); // 300ms total (debounce time)
  expect(mockService.search).toHaveBeenCalledWith('ang');
}));

it('should handle delayed response', fakeAsync(() => {
  mockService.getProducts.and.returnValue(
    of(mockProducts).pipe(delay(1000))
  );

  component.loadProducts();
  expect(component.loading).toBe(true);

  tick(1000);
  expect(component.loading).toBe(false);
  expect(component.products).toEqual(mockProducts);
}));
```

---

## ✅ Test Coverage Goals

**Aim for meaningful coverage, not 100%:**
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

**What to test:**
- ✅ Business logic
- ✅ User interactions
- ✅ Error handling
- ✅ Edge cases
- ✅ Integration between components

**What NOT to test:**
- ❌ Third-party libraries
- ❌ Angular framework code
- ❌ Simple getters/setters
- ❌ Interfaces/types

---

## 🧪 Running Tests

```bash
# Run all tests (Vitest)
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific file
npm test product.service.spec.ts
```

---

## 📚 Resources

**Testing Guides:**
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Testing with Vitest](https://vitest.dev/guide/)
- [Jasmine Documentation](https://jasmine.github.io/)

**Best Practices:**
- [Testing Best Practices](https://angular.dev/guide/testing/test-techniques)
- [Component Testing Scenarios](https://angular.dev/guide/testing/components-scenarios)

---

**Write tests that give you confidence, not just coverage numbers!**
