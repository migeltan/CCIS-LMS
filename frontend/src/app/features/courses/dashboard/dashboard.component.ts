import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import {
  CourseDialogComponent,
  CourseFormData,
} from '../../../shared/course-dialog/course-dialog.component';
import {
  MOCK_COURSES,
  clearDemoData,
  demoDataLoaded,
  loadDemoData,
} from '../../../shared/mock/lms-mock-data';
import { Course } from '../../../shared/models/lms.models';
import {
  SectionDialogComponent,
  SectionFormData,
} from '../../../shared/section-dialog/section-dialog.component';
import { StorageService } from '../../../shared/storage/storage.service';
import { generateSectionCode } from '../../../shared/utils/section-code';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatSlideToggleModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(StorageService);

  // This is the magic function that People and Grades are now listening to!
  protected readonly demoLoaded = demoDataLoaded;

  protected readonly teacherFullName = 'Maria Santos';
  protected readonly teacherLastName = 'Santos';
  protected readonly courses: Course[] = MOCK_COURSES;

  protected async toggleDemo(change: MatSlideToggleChange): Promise<void> {
    if (change.checked) {
      loadDemoData();
      return; // <-- The demoService line is gone
    }

    const confirmed = await firstValueFrom(
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          width: '560px',
          data: {
            message:
              'Turn off demo data? The sample courses, students and grades will be removed, along with anything you added this session.',
            confirmLabel: 'Turn off',
          },
        })
        .afterClosed(),
    );

    if (confirmed) {
      clearDemoData(); // <-- The demoService line is gone
    } else {
      change.source.checked = true;
    }
  }

  protected coverFor(course: Course): string {
    return course.coverImageUrl
      ? `center / cover no-repeat url("${course.coverImageUrl}")`
      : course.coverGradient;
  }

  protected async openAddCourse(): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<CourseDialogComponent, undefined, CourseFormData>(CourseDialogComponent, {
          width: '560px',
        })
        .afterClosed(),
    );
    if (!result) {
      return;
    }
    const course: Course = {
      id: `course-${Date.now()}`,
      code: result.code,
      title: result.title,
      coverGradient: result.coverGradient,
      sections: [],
    };
    this.courses.push(course);
    if (result.coverFile) {
      await this.attachCover(course, result.coverFile);
    }
  }

    protected async openEditCourse(course: Course): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<CourseDialogComponent, Course, CourseFormData>(CourseDialogComponent, {
          width: '560px',
          data: course, // the dialog uses this to pre-fill the form
        })
        .afterClosed(),
    );
    if (!result) {
      return;
    }

    const colorChanged = result.coverGradient !== course.coverGradient;

    course.code = result.code;
    course.title = result.title;
    course.coverGradient = result.coverGradient;

    if (result.coverFile) {
      await this.attachCover(course, result.coverFile);
    } else if (colorChanged) {
      // a new color replaces the old photo cover
      course.coverImageUrl = undefined;
    }
  }

  protected async createSection(course: Course): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<SectionDialogComponent, undefined, SectionFormData>(SectionDialogComponent, {
          width: '480px',
        })
        .afterClosed(),
    );
    if (!result) {
      return;
    }
    course.sections.push({
      id: `sec-${Date.now()}`,
      courseId: course.id,
      name: result.name,
      sectionCode: generateSectionCode(),
    });
  }

  protected confirmDelete(course: Course): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '560px',
        data: {
          message:
            'This action is permanent and cannot be undone. All data including materials, activities, and student grades will be permanently lost.',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        const index = this.courses.findIndex((c) => c.id === course.id);
        if (index !== -1) {
          this.courses.splice(index, 1);
        }
      });
  }

  private async attachCover(course: Course, file: File): Promise<void> {
    try {
      course.coverImageUrl = await this.storage.uploadCourseCover(course.id, file);
    } catch {
      this.snackBar.open(
        'Cover photo upload failed. The course was saved with a color instead.',
        'Dismiss',
        { duration: 5000 },
      );
    }
  }
}
