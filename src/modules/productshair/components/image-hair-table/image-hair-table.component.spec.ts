import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageHairTableComponent } from './image-hair-table.component';

describe('ImageHairTableComponent', () => {
  let component: ImageHairTableComponent;
  let fixture: ComponentFixture<ImageHairTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageHairTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageHairTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
