import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { Activity, MySection, SubmissionWithFiles } from '../models/classwork.models';
import { Activities } from './activities';
import { Enrollments } from './enrollments';
import { Submissions } from './submissions';

export type WorkStatus = 'assigned' | 'missing' | 'done';

export interface WorkItem {
  activity: Activity;
  section: MySection;
  submission: SubmissionWithFiles | undefined;
  /** assigned = not submitted, not late. missing = not submitted, past due. done = submitted. */
  status: WorkStatus;
  /** Only set after the teacher released the grade. */
  score: number | null;
}

@Injectable({ providedIn: 'root' })
export class StudentWork {
  private enrollments = inject(Enrollments);
  private activities = inject(Activities);
  private submissions = inject(Submissions);

  /** Every activity of the student's classes (or just one class) with its status. */
  load(studentId: string, sectionId?: string): Observable<WorkItem[]> {
    return this.enrollments.listMySections(studentId).pipe(
      map((all) => (sectionId ? all.filter((s) => s.id === sectionId) : all)),
      switchMap((sections) => {
        if (!sections.length) return of([] as WorkItem[]);
        return forkJoin([
          forkJoin(sections.map((s) => this.activities.listBySection(s.id))),
          this.submissions.listByStudent(studentId),
        ]).pipe(
          map(([lists, subs]) => {
            const byActivity = new Map(
              subs.map((s): [string, SubmissionWithFiles] => [s.activity_id, s]),
            );
            const now = Date.now();
            return sections.flatMap((section, i) =>
              lists[i].map((activity): WorkItem => {
                const submission = byActivity.get(activity.id);
                const late = !!activity.due_at && new Date(activity.due_at).getTime() < now;
                const status: WorkStatus = submission ? 'done' : late ? 'missing' : 'assigned';
                const score =
                  submission?.grade_released && submission.score !== null
                    ? submission.score
                    : null;
                return { activity, section, submission, status, score };
              }),
            );
          }),
        );
      }),
    );
  }
}

/** Average grade in %, weighted by points, from released grades only. */
export function averagePercent(items: WorkItem[]): number | null {
  const graded = items.filter((i) => i.score !== null && i.activity.points > 0);
  if (!graded.length) return null;
  const earned = graded.reduce((n, i) => n + (i.score ?? 0), 0);
  const total = graded.reduce((n, i) => n + i.activity.points, 0);
  return Math.round((earned / total) * 1000) / 10;
}