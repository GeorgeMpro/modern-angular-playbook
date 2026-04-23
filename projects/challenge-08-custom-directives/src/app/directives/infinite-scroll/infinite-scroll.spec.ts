import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfiniteScroll } from './infinite-scroll';

describe('InfiniteScroll', () => {
  let component: InfiniteScroll;
  let fixture: ComponentFixture<InfiniteScroll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfiniteScroll]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfiniteScroll);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
