import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Activity, NewActivity } from '../models/classwork.models';
import { supabase, unwrap } from '../supabase';

@Injectable({ providedIn: 'root' })
export class Activities {
  listBySection(sectionId: string): Observable<Activity[]> {
    return from(
      supabase
        .from('activities')
        .select('*')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: false }),
    ).pipe(map((res) => unwrap(res)));
  }

  getById(id: string): Observable<Activity | undefined> {
    return from(supabase.from('activities').select('*').eq('id', id).maybeSingle()).pipe(
      map((res) => unwrap(res) ?? undefined),
    );
  }

  create(input: NewActivity): Observable<Activity> {
    return from(supabase.from('activities').insert(input).select().single()).pipe(
      map((res) => unwrap(res)),
    );
  }
}