import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeViewer } from './prototype-viewer';

describe('PrototypeViewer', () => {
  let component: PrototypeViewer;
  let fixture: ComponentFixture<PrototypeViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrototypeViewer],
    }).compileComponents();

    fixture = TestBed.createComponent(PrototypeViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
