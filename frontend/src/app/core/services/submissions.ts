import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { GradebookRow, NewSubmission, SubmissionWithFiles } from '../models/classwork.models';
import { supabase, unwrap } from '../supabase';

@Injectable({ providedIn: 'root' })
export class Submissions {
  getMine(activityId: string, studentId: string): Observable<SubmissionWithFiles | undefined> {
    return from(this.fetchMine(activityId, studentId));
  }

  private async fetchMine(activityId: string, studentId: string) {
    const res = await supabase
      .from('submissions')
      .select('*, attachments(*)')
      .eq('activity_id', activityId)
      .eq('student_id', studentId)
      .maybeSingle();
    return (unwrap(res) ?? undefined) as SubmissionWithFiles | undefined;
  }

  listByActivity(activityId: string): Observable<GradebookRow[]> {
    return from(this.fetchByActivity(activityId));
  }

  private async fetchByActivity(activityId: string): Promise<GradebookRow[]> {
    const rows = unwrap(
      await supabase.from('submissions').select('*, attachments(*)').eq('activity_id', activityId),
    ) as SubmissionWithFiles[];

    // Names come from profiles. If the teacher can't read them, we just show no name.
    const ids = rows.map((r) => r.student_id);
    const names: Record<string, string | null> = {};
    if (ids.length) {
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      (data ?? []).forEach((p) => (names[p.id] = p.full_name));
    }
    return rows.map((r) => ({ ...r, student_name: names[r.student_id] ?? null }));
  }

  listByStudent(studentId: string): Observable<SubmissionWithFiles[]> {
    return from(
      supabase.from('submissions').select('*, attachments(*)').eq('student_id', studentId),
    ).pipe(map((res) => unwrap(res) as SubmissionWithFiles[]));
  }

  submit(input: NewSubmission): Observable<SubmissionWithFiles> {
    return from(this.doSubmit(input));
  }

  private async doSubmit(input: NewSubmission): Promise<SubmissionWithFiles> {
    // upsert only touches these columns, so an existing score/feedback is kept
    const sub = unwrap(
      await supabase
        .from('submissions')
        .upsert(
          {
            activity_id: input.activityId,
            student_id: input.studentId,
            answer_text: input.answerText,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'activity_id,student_id' },
        )
        .select()
        .single(),
    ) as unknown as { id: string };
    
    if (input.file) {
      const path = `${input.sectionId}/${input.studentId}/${Date.now()}_${input.file.name}`;
      const up = await supabase.storage.from('submissions').upload(path, input.file);
      if (up.error) throw new Error(up.error.message);

      await supabase.from('attachments').delete().eq('submission_id', sub.id);
      unwrap(
        await supabase
          .from('attachments')
          .insert({ submission_id: sub.id, file_name: input.file.name, storage_path: path })
          .select(),
      );
    }

    return (await this.fetchMine(input.activityId, input.studentId))!;
  }

  // Used by the Grades service.
  updateGrade(
    id: string,
    score: number,
    feedback: string,
    release: boolean,
  ): Observable<SubmissionWithFiles> {
    return from(
      supabase
        .from('submissions')
        .update({ score, feedback, grade_released: release, status: 'graded' })
        .eq('id', id)
        .select('*, attachments(*)')
        .single(),
    ).pipe(map((res) => unwrap(res) as SubmissionWithFiles));
  }
}