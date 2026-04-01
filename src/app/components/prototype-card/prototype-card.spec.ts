import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeCard } from './prototype-card';

describe('PrototypeCard', () => {
  let component: PrototypeCard;
  let fixture: ComponentFixture<PrototypeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrototypeCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PrototypeCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
