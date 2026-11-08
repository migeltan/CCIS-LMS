import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourseDialog } from './course-dialog';

describe('CourseDialog', () => {
  let component: CourseDialog;
  let fixture: ComponentFixture<CourseDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
