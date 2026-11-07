import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { Activity, SubmissionWithFiles } from '../../../core/models/classwork.models';
import { Activities } from '../../../core/services/activities';
import { Grades } from '../../../core/services/grades';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';

interface GradeItem {
  submission: SubmissionWithFiles;
  activity: Activity | undefined;
}

@Component({
  selector: 'app-my-grades',
  imports: [DatePipe, MatCardModule],
  templateUrl: './my-grades.html',
})
export class MyGrades implements OnInit {
  private gradesService = inject(Grades);
  private activitiesService = inject(Activities);

  items = signal<GradeItem[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.gradesService
      .listMyGrades(TEMP_STUDENT_ID)
      .pipe(
        switchMap((list) =>
          list.length
            ? forkJoin(list.map((s) => this.activitiesService.getById(s.activity_id))).pipe(
                map((activities) =>
                  list.map((s, i): GradeItem => ({ submission: s, activity: activities[i] })),
                ),
              )
            : of([] as GradeItem[]),
        ),
      )
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Could not load your grades. Please try again.');
        },
      });
  }
}