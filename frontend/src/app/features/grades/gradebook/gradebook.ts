import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Activity, GradebookRow } from '../../../core/models/classwork.models';
import { Activities } from '../../../core/services/activities';
import { Grades } from '../../../core/services/grades';
import { Submissions } from '../../../core/services/submissions';

@Component({
  selector: 'app-gradebook',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './gradebook.html',
})
export class Gradebook implements OnInit {
  private route = inject(ActivatedRoute);
  private activitiesService = inject(Activities);
  private submissionsService = inject(Submissions);
  private gradesService = inject(Grades);

  // Works as a routed page (:activityId) or embedded in a section tab.
  readonly activityIdInput = input<string>(undefined, { alias: 'activityId' });

  activity = signal<Activity | undefined>(undefined);
  rows = signal<GradebookRow[]>([]);
  loading = signal(true);
  savingId = signal<string | null>(null);
  error = signal('');
  message = signal('');

  private activityId: string | null = null;

  ngOnInit(): void {
    this.activityId = this.activityIdInput() ?? this.route.snapshot.paramMap.get('activityId');
    if (!this.activityId) {
      this.loading.set(false);
      this.error.set('No activity selected.');
      return;
    }
    this.activitiesService.getById(this.activityId).subscribe((a) => this.activity.set(a));
    this.reload();
  }

  private reload(): void {
    if (!this.activityId) return;
    this.submissionsService.listByActivity(this.activityId).subscribe((list) => {
      this.rows.set(list);
      this.loading.set(false);
    });
  }

  save(row: GradebookRow, scoreText: string, feedback: string, release: boolean): void {
    this.error.set('');
    this.message.set('');

    const max = this.activity()?.points ?? 100;
    const score = Number(scoreText);
    if (scoreText.trim() === '' || Number.isNaN(score) || score < 0 || score > max) {
      this.error.set(`Enter a score between 0 and ${max}.`);
      return;
    }

    this.savingId.set(row.id);
    this.gradesService.gradeSubmission(row.id, score, feedback.trim(), release).subscribe({
      next: () => {
        this.savingId.set(null);
        this.message.set(`Saved grade for ${row.student_name ?? row.student_id}.`);
        this.reload();
      },
      error: () => {
        this.savingId.set(null);
        this.error.set('Could not save the grade. Please try again.');
      },
    });
  }
}