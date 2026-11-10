import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/auth/auth.service';
import { Activity, SubmissionWithFiles } from '../../../../core/models/classwork.models';
import { Activities } from '../../../../core/services/activities';
import { Submissions } from '../../../../core/services/submissions';
import { Skeleton } from '../../../skeleton/skeleton';

const DAY_MS = 24 * 60 * 60 * 1000;

type Status = 'Not submitted' | 'Submitted' | 'Graded';

@Component({
  selector: 'app-activity-list',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Skeleton,
  ],
  templateUrl: './activity-list.html',
  styleUrl: './activity-list.scss',
})
export class ActivityList implements OnInit {
  private route = inject(ActivatedRoute);
  private activitiesService = inject(Activities);
  private submissionsService = inject(Submissions);
  private auth = inject(AuthService);

  // Works both as a routed page (:sectionId) and embedded in Nicole's Classwork tab.
  readonly sectionIdInput = input<string>(undefined, { alias: 'sectionId' });

  activities = signal<Activity[]>([]);
  private mine = signal<Record<string, SubmissionWithFiles>>({});
  loading = signal(true);
  error = signal('');
  currentSectionId = signal<string | null>(null);

  /** To-do: not submitted yet and due within the next 7 days. */
  todo = computed(() => {
    const now = Date.now();
    const limit = now + 7 * DAY_MS;
    return this.activities().filter((a) => {
      if (!a.due_at || this.mine()[a.id]) return false;
      const due = new Date(a.due_at).getTime();
      return due >= now && due <= limit;
    });
  });

  ngOnInit(): void {
    const sectionId = this.sectionIdInput() ?? this.route.snapshot.paramMap.get('sectionId');
    if (!sectionId) {
      this.loading.set(false);
      this.error.set('No section selected.');
      return;
    }
    this.currentSectionId.set(sectionId);

    forkJoin([
      this.activitiesService.listBySection(sectionId),
      this.submissionsService.listByStudent(this.auth.userId() ?? ''),
    ]).subscribe({
      next: ([activities, subs]) => {
        // Soonest due date first; activities without a due date go last.
        const sorted = [...activities].sort((a, b) => {
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return a.due_at.localeCompare(b.due_at);
        });
        this.activities.set(sorted);
        this.mine.set(Object.fromEntries(subs.map((s) => [s.activity_id, s])));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the activities. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private submissionOf(a: Activity): SubmissionWithFiles | undefined {
    return this.mine()[a.id];
  }

  status(a: Activity): Status {
    const sub = this.submissionOf(a);
    if (!sub) return 'Not submitted';
    if (sub.status === 'graded' && sub.grade_released) return 'Graded';
    return 'Submitted';
  }

  /** Score text, only after the teacher released the grade. */
  score(a: Activity): string | null {
    const sub = this.submissionOf(a);
    if (sub?.grade_released && sub.score !== null) return `${sub.score} / ${a.points}`;
    return null;
  }

  isOverdue(a: Activity): boolean {
    return !!a.due_at && new Date(a.due_at) < new Date() && !this.submissionOf(a);
  }

  icon(a: Activity): string {
    const s = this.status(a);
    if (s === 'Graded') return 'task_alt';
    if (s === 'Submitted') return 'check_circle';
    return 'assignment';
  }

  /** "Due today", "Due tomorrow", "Due in 4 days". */
  dueLabel(a: Activity): string {
    if (!a.due_at) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(a.due_at);
    dueDay.setHours(0, 0, 0, 0);
    const diff = Math.round((dueDay.getTime() - today.getTime()) / DAY_MS);
    if (diff <= 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff} days`;
  }
}