import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  imports: [DatePipe, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './my-grades.html',
  styleUrl: './my-grades.scss',
})
export class MyGrades implements OnInit {
  private gradesService = inject(Grades);
  private activitiesService = inject(Activities);

  items = signal<GradeItem[]>([]);
  loading = signal(true);
  error = signal('');

  /** Average percentage across graded activities that have known points. */
  average = computed(() => {
    const percents = this.items()
      .map((i) => this.percent(i))
      .filter((p): p is number => p !== null);
    if (percents.length === 0) return null;
    return Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
  });

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

  percent(item: GradeItem): number | null {
    const points = item.activity?.points;
    if (!points) return null;
    return Math.round(((item.submission.score ?? 0) / points) * 100);
  }
}