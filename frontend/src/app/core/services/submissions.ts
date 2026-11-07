import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  Attachment,
  GradebookRow,
  NewSubmission,
  Submission,
  SubmissionWithFiles,
} from '../models/classwork.models';

@Injectable({ providedIn: 'root' })
export class Submissions {
    private submissions: Submission[] = [
    {
      id: 'sub-seed-1',
      activity_id: 'activity-1',
      student_id: 'student-2',
      answer_text: 'https://example.com/juan-essay',
      status: 'submitted',
      score: null,
      feedback: null,
      grade_released: false,
      submitted_at: new Date().toISOString(),
    },
    {
      id: 'sub-seed-2',
      activity_id: 'activity-2',
      student_id: 'student-1',
      answer_text: 'https://example.com/my-reflection',
      status: 'graded',
      score: 45,
      feedback: 'Good reflection. Add more examples next time.',
      grade_released: true,
      submitted_at: new Date().toISOString(),
    },
  ];
  private attachments: Attachment[] = [];

  // Mock only. The real service will join the profiles table for full_name.
  private names: Record<string, string> = {
    'student-1': 'Test Student',
    'student-2': 'Juan Dela Cruz',
  };

  private withFiles(s: Submission): SubmissionWithFiles {
    return { ...s, attachments: this.attachments.filter((a) => a.submission_id === s.id) };
  }

  getMine(activityId: string, studentId: string): Observable<SubmissionWithFiles | undefined> {
    const found = this.submissions.find(
      (s) => s.activity_id === activityId && s.student_id === studentId,
    );
    return of(found ? this.withFiles(found) : undefined).pipe(delay(200));
  }

  listByActivity(activityId: string): Observable<GradebookRow[]> {
    return of(
      this.submissions
        .filter((s) => s.activity_id === activityId)
        .map((s) => ({ ...this.withFiles(s), student_name: this.names[s.student_id] ?? null })),
    ).pipe(delay(200));
  }

  listByStudent(studentId: string): Observable<SubmissionWithFiles[]> {
    return of(
      this.submissions.filter((s) => s.student_id === studentId).map((s) => this.withFiles(s)),
    ).pipe(delay(200));
  }

  submit(input: NewSubmission): Observable<SubmissionWithFiles> {
    const existing = this.submissions.find(
      (s) => s.activity_id === input.activityId && s.student_id === input.studentId,
    );
    const id = existing?.id ?? crypto.randomUUID();
    const now = new Date().toISOString();

    const submission: Submission = {
      id,
      activity_id: input.activityId,
      student_id: input.studentId,
      answer_text: input.answerText,
      status: 'submitted',
      score: existing?.score ?? null,
      feedback: existing?.feedback ?? null,
      grade_released: existing?.grade_released ?? false,
      submitted_at: now,
    };
    this.submissions = [...this.submissions.filter((s) => s.id !== id), submission];

    if (input.file) {
      // Same path your team agreed on. In the real service this is uploaded to the 'submissions' bucket.
      const path = `${input.sectionId}/${input.studentId}/${Date.now()}_${input.file.name}`;
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        activity_id: null,
        material_id: null,
        submission_id: id,
        file_name: input.file.name,
        storage_path: path,
        created_at: now,
      };
      this.attachments = [...this.attachments.filter((a) => a.submission_id !== id), attachment];
    }

    return of(this.withFiles(submission)).pipe(delay(200));
  }

  // Used by the Grades service so both share one store.
  updateGrade(
    id: string,
    score: number,
    feedback: string,
    release: boolean,
  ): Observable<SubmissionWithFiles> {
    this.submissions = this.submissions.map((s) =>
      s.id === id ? { ...s, score, feedback, grade_released: release, status: 'graded' } : s,
    );
    const updated = this.submissions.find((s) => s.id === id)!;
    return of(this.withFiles(updated)).pipe(delay(200));
  }
}