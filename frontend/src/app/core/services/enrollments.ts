import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { MySection } from '../models/classwork.models';

@Injectable({ providedIn: 'root' })
export class Enrollments {
  /** Goes up every time a student joins a class, so the sidebar knows to reload. */
  readonly version = signal(0);

  // Mock catalog. The real service reads sections and courses from Supabase.
  private catalog: MySection[] = [
    {
      id: 'section-1',
      course_id: 'course-1',
      name: 'BSIT 3-1',
      join_code: 'ABC123',
      teacher_id: 'teacher-1',
      term: '1st Sem 2026-2027',
      created_at: new Date().toISOString(),
      course_code: 'INTE 301',
      course_title: 'Systems Integration and Architecture',
    },
    {
      id: 'section-2',
      course_id: 'course-2',
      name: 'BSIT 3-2',
      join_code: 'XYZ789',
      teacher_id: 'teacher-1',
      term: '1st Sem 2026-2027',
      created_at: new Date().toISOString(),
      course_code: 'COMP 101',
      course_title: 'Web Development',
    },
  ];

  // studentId -> list of section ids
  private enrolled: Record<string, string[]> = {};

  listMySections(studentId: string): Observable<MySection[]> {
    const ids = this.enrolled[studentId] ?? []; // already in the order they joined
    const list = ids
      .map((id) => this.catalog.find((s) => s.id === id))
      .filter((s): s is MySection => !!s);
    return of(list).pipe(delay(200));
  }

  /** Same idea as the join_section(p_code) RPC: returns the section id. */
  joinSection(studentId: string, code: string): Observable<string> {
    const section = this.catalog.find(
      (s) => s.join_code.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!section) {
      return throwError(() => new Error('Invalid join code')).pipe(delay(200));
    }
    const ids = this.enrolled[studentId] ?? [];
    if (!ids.includes(section.id)) {
      this.enrolled[studentId] = [...ids, section.id];
      this.version.update((v) => v + 1);
    }
    return of(section.id).pipe(delay(200));
  }
}