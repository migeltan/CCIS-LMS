import { Injectable, signal } from '@angular/core';
import { Observable, from, map, tap } from 'rxjs';
import { MySection } from '../models/classwork.models';
import { supabase, unwrap } from '../supabase';

@Injectable({ providedIn: 'root' })
export class Enrollments {
  /** Goes up every time a student joins a class, so the sidebar knows to reload. */
  readonly version = signal(0);

  listMySections(studentId: string): Observable<MySection[]> {
    return from(
      supabase
        .from('enrollments')
        .select('joined_at, sections(*, courses(code, title))')
        .eq('student_id', studentId)
        .order('joined_at', { ascending: true }),
    ).pipe(
      map((res) =>
        (unwrap(res) as any[]).map((row) => {
          const { courses, ...section } = row.sections;
          return { ...section, course_code: courses.code, course_title: courses.title } as MySection;
        }),
      ),
    );
  }

  /** Calls the join_section(p_code) RPC. Returns the section id. */
  joinSection(_studentId: string, code: string): Observable<string> {
    return from(supabase.rpc('join_section', { p_code: code })).pipe(
      map((res) => unwrap(res) as string),
      tap(() => this.version.update((v) => v + 1)),
    );
  }
}