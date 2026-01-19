import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EqualExample } from './equal-example';

describe('EqualExample', () => {
  let component: EqualExample;
  let fixture: ComponentFixture<EqualExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EqualExample]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EqualExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
