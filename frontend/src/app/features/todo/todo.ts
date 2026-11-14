import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { MySection } from '../../core/models/classwork.models';
import { StudentWork, WorkItem, WorkStatus } from '../../core/services/student-work';
import { Skeleton } from '../skeleton/skeleton';

const DAY_MS = 24 * 60 * 60 * 1000;

interface Group {
  label: string;
  items: WorkItem[];
}

const EMPTY: Record<WorkStatus, { icon: string; title: string; text: string }> = {
  assigned: { icon: 'task_alt', title: "You're all caught up", text: 'Nothing is assigned right now.' },
  missing: { icon: 'sentiment_satisfied', title: 'Nothing missing', text: 'You have no late work.' },
  done: { icon: 'inbox', title: 'Nothing done yet', text: 'Work you turn in will show up here.' },
};

@Component({
  selector: 'app-todo',
  imports: [DatePipe, RouterLink, MatFormFieldModule, MatIconModule, MatSelectModule, Skeleton],
  templateUrl: './todo.html',
  styleUrl: './todo.scss',
})
export class Todo implements OnInit {
  private auth = inject(AuthService);
  private work = inject(StudentWork);

  items = signal<WorkItem[]>([]);
  loading = signal(true);
  error = signal('');
  tab = signal<WorkStatus>('assigned');
  classFilter = signal('all');

  readonly tabs: { id: WorkStatus; label: string }[] = [
    { id: 'assigned', label: 'Assigned' },
    { id: 'missing', label: 'Missing' },
    { id: 'done', label: 'Done' },
  ];

  classes = computed(() => {
    const map = new Map<string, MySection>();
    for (const i of this.items()) map.set(i.section.id, i.section);
    return [...map.values()];
  });

  private inClass = computed(() =>
    this.items().filter((i) => this.classFilter() === 'all' || i.section.id === this.classFilter()),
  );

  counts = computed(() => {
    const c: Record<WorkStatus, number> = { assigned: 0, missing: 0, done: 0 };
    for (const i of this.inClass()) c[i.status]++;
    return c;
  });

  groups = computed<Group[]>(() => {
    const list = this.inClass()
      .filter((i) => i.status === this.tab())
      .sort((a, b) => this.dueMs(a) - this.dueMs(b) || 0);

    if (this.tab() === 'assigned') {
      const now = Date.now();
      return [
        { label: 'No due date', items: list.filter((i) => !i.activity.due_at) },
        { label: 'This week', items: list.filter((i) => this.dueMs(i) < now + 7 * DAY_MS) },
        {
          label: 'Next week',
          items: list.filter((i) => this.dueMs(i) >= now + 7 * DAY_MS && this.dueMs(i) < now + 14 * DAY_MS),
        },
        { label: 'Later', items: list.filter((i) => this.dueMs(i) >= now + 14 * DAY_MS && this.dueMs(i) !== Infinity) },
      ];
    }
    if (this.tab() === 'missing') return [{ label: 'Past due', items: list }];
    return [
      { label: 'Graded', items: list.filter((i) => i.score !== null) },
      { label: 'Turned in, waiting for a grade', items: list.filter((i) => i.score === null) },
    ];
  });

  visibleCount = computed(() => this.groups().reduce((n, g) => n + g.items.length, 0));
  empty = computed(() => EMPTY[this.tab()]);

  ngOnInit(): void {
    this.work.load(this.auth.userId() ?? '').subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your to-do list. Please try again.');
        this.loading.set(false);
      },
    });
  }

  /** Due time in ms. No due date sorts last and counts as Infinity. */
  private dueMs(i: WorkItem): number {
    return i.activity.due_at ? new Date(i.activity.due_at).getTime() : Infinity;
  }
}