import { DatePipe, Location } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, map, of, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Activity, GradebookRow } from '../../../core/models/classwork.models';
import { Activities } from '../../../core/services/activities';
import { Grades } from '../../../core/services/grades';
import { Submissions } from '../../../core/services/submissions';
import { ConfirmDialog } from '../../classwork/activities/confirm-dialog/confirm-dialog';
import { Skeleton } from '../../skeleton/skeleton';

// Keep the "Saving..." state visible long enough for the user to notice it.
const MIN_SAVING_MS = 600;

@Component({
  selector: 'app-gradebook',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Skeleton,
  ],
  templateUrl: './gradebook.html',
  styleUrl: './gradebook.scss',
})
export class Gradebook implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private dialog = inject(MatDialog);
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

  // Per-row feedback, keyed by submission id.
  rowErrors = signal<Record<string, string>>({});
  rowMessages = signal<Record<string, string>>({});
  shakeId = signal<string | null>(null);

  gradedCount = computed(() => this.rows().filter((r) => r.status === 'graded').length);
  releasedCount = computed(() => this.rows().filter((r) => r.grade_released).length);

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

  back(): void {
    this.location.back();
  }

  // ---------- Helpers for the template ----------
  name(row: GradebookRow): string {
    return row.student_name ?? row.student_id;
  }

  initial(row: GradebookRow): string {
    return this.name(row).charAt(0).toUpperCase();
  }

  statusLabel(row: GradebookRow): string {
    if (row.grade_released) return 'Released';
    if (row.status === 'graded') return 'Graded';
    return 'Needs grading';
  }

  isLate(row: GradebookRow): boolean {
    const due = this.activity()?.due_at;
    return !!due && !!row.submitted_at && new Date(row.submitted_at) > new Date(due);
  }

  endShake(event: AnimationEvent): void {
    if (event.target === event.currentTarget) this.shakeId.set(null);
  }

  /** Clears the red state and the "Saved" message of one row (called when the teacher edits it). */
  clearRow(id: string): void {
    if (this.rowErrors()[id]) this.rowErrors.update((r) => this.without(r, id));
    if (this.rowMessages()[id]) this.rowMessages.update((r) => this.without(r, id));
  }

  private without(record: Record<string, string>, id: string): Record<string, string> {
    const copy = { ...record };
    delete copy[id];
    return copy;
  }

  // ---------- Saving ----------
  save(row: GradebookRow, scoreText: string, feedback: string, release: boolean): void {
    if (this.savingId()) return;
    this.clearRow(row.id);

    const max = this.activity()?.points ?? 100;
    const score = Number(scoreText);
    if (scoreText.trim() === '' || Number.isNaN(score) || score < 0 || score > max) {
      this.rowErrors.update((r) => ({
        ...r,
        [row.id]: `Enter a score between 0 and ${max}.`,
      }));
      this.shakeId.set(row.id);
      return;
    }

    // Releasing shows the grade to the student, so ask first.
    if (release) {
      this.dialog
        .open(ConfirmDialog, {
          width: '400px',
          data: {
            title: 'Release this grade?',
            message: `${this.name(row)} will see ${score} / ${max} and your feedback.`,
            confirmText: 'Yes, release',
          },
        })
        .afterClosed()
        .subscribe((ok: boolean) => {
          if (ok) this.doSave(row, score, feedback.trim(), release);
        });
      return;
    }

    this.doSave(row, score, feedback.trim(), release);
  }

  private doSave(row: GradebookRow, score: number, feedback: string, release: boolean): void {
    this.savingId.set(row.id);

    const request$ = this.gradesService.gradeSubmission(row.id, score, feedback, release).pipe(
      map(() => true),
      catchError(() => of(false)),
    );

    // Wait for BOTH the request and the minimum loading time.
    forkJoin([request$, timer(MIN_SAVING_MS)]).subscribe(([ok]) => {
      this.savingId.set(null);

      if (!ok) {
        this.rowErrors.update((r) => ({
          ...r,
          [row.id]: 'Could not save the grade. Please try again.',
        }));
        return;
      }

      this.rowMessages.update((r) => ({
        ...r,
        [row.id]: release ? 'Saved and released to the student.' : 'Saved. Not released yet.',
      }));
      this.reload();
    });
  }
}