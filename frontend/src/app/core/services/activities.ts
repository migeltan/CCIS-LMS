import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Activity, NewActivity } from '../models/classwork.models';

@Injectable({ providedIn: 'root' })
export class Activities {
  private data: Activity[] = [
    {
      id: 'activity-1',
      section_id: 'section-1',
      title: 'Activity 1: Intro Essay',
      instructions: 'Write a one-page essay about your goals.',
      points: 100,
      due_at: '2026-11-12T23:59:00Z',
      form_url: null,
      created_at: new Date().toISOString(),
    },
  ];

  listBySection(sectionId: string): Observable<Activity[]> {
    return of(this.data.filter((a) => a.section_id === sectionId)).pipe(delay(200));
  }

  getById(id: string): Observable<Activity | undefined> {
    return of(this.data.find((a) => a.id === id)).pipe(delay(200));
  }

  create(input: NewActivity): Observable<Activity> {
    const activity: Activity = {
      id: crypto.randomUUID(),
      section_id: input.section_id,
      title: input.title,
      instructions: input.instructions ?? null,
      points: input.points ?? 100,
      due_at: input.due_at ?? null,
      form_url: input.form_url ?? null,
      created_at: new Date().toISOString(),
    };
    this.data = [activity, ...this.data];
    return of(activity).pipe(delay(200));
  }
}