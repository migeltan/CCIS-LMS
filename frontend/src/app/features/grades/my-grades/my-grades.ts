import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { StudentWork, WorkItem, averagePercent } from '../../../core/services/student-work';
import { Skeleton } from '../../skeleton/skeleton';

@Component({
  selector: 'app-my-grades',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, Skeleton],
  templateUrl: './my-grades.html',
  styleUrl: './my-grades.scss',
})
export class MyGrades implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private work = inject(StudentWork);

  /** Set on /class/:sectionId/work. Empty on /my-grades (all classes). */
  sectionId = signal<string | null>(null);
  items = signal<WorkItem[]>([]);
  loading = signal(true);
  error = signal('');

  subtitle = computed(() => {
    const s = this.items()[0]?.section;
    return this.sectionId() && s ? `${s.course_code} · ${s.course_title}` : 'All my classes';
  });

  average = computed(() => averagePercent(this.items()));
  gradedCount = computed(() => this.items().filter((i) => i.score !== null).length);

  rows = computed(() =>
    [...this.items()].sort((a, b) => this.dueMs(a) - this.dueMs(b) || 0),
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sectionId');
    this.sectionId.set(id);
    this.work.load(this.auth.userId() ?? '', id ?? undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your grades. Please try again.');
        this.loading.set(false);
      },
    });
  }

  label(i: WorkItem): string {
    if (i.score !== null) return 'Graded';
    if (i.submission) return 'Turned in';
    return i.status === 'missing' ? 'Missing' : 'Assigned';
  }

  percent(i: WorkItem): number {
    return i.score === null ? 0 : Math.round((i.score / i.activity.points) * 100);
  }

  private dueMs(i: WorkItem): number {
    return i.activity.due_at ? new Date(i.activity.due_at).getTime() : Infinity;
  }
}