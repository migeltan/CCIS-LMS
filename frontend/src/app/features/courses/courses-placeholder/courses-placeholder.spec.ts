import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoursesPlaceholder } from './courses-placeholder';

describe('CoursesPlaceholder', () => {
  let component: CoursesPlaceholder;
  let fixture: ComponentFixture<CoursesPlaceholder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesPlaceholder],
    }).compileComponents();

    fixture = TestBed.createComponent(CoursesPlaceholder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
