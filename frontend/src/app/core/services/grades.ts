import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SubmissionWithFiles } from '../models/classwork.models';
import { Submissions } from './submissions';

@Injectable({ providedIn: 'root' })
export class Grades {
  private submissions = inject(Submissions);

  /** Teacher: save score + feedback. release=true lets the student see it. */
  gradeSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    release = true,
  ): Observable<SubmissionWithFiles> {
    return this.submissions.updateGrade(submissionId, score, feedback, release);
  }

  /** Student: only grades the teacher has released. */
  listMyGrades(studentId: string): Observable<SubmissionWithFiles[]> {
    return this.submissions
      .listByStudent(studentId)
      .pipe(map((list) => list.filter((s) => s.grade_released)));
  }
}