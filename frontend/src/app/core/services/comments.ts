import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

// Mock only: there is no comments table in the schema yet.
export interface ActivityComment {
  id: string;
  activity_id: string;
  student_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface NewComment {
  activityId: string;
  studentId: string;
  authorId: string;
  authorName: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class Comments {
  private data: ActivityComment[] = [];

  /** Private thread between one student and the teacher for one activity. */
  listForStudent(activityId: string, studentId: string): Observable<ActivityComment[]> {
    return of(
      this.data
        .filter((c) => c.activity_id === activityId && c.student_id === studentId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    ).pipe(delay(200));
  }

  add(input: NewComment): Observable<ActivityComment> {
    const comment: ActivityComment = {
      id: crypto.randomUUID(),
      activity_id: input.activityId,
      student_id: input.studentId,
      author_id: input.authorId,
      author_name: input.authorName,
      body: input.body,
      created_at: new Date().toISOString(),
    };
    this.data = [...this.data, comment];
    return of(comment).pipe(delay(300));
  }
}