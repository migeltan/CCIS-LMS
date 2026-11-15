import { Injectable, InjectionToken, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');

/** "section-1/1731000000000_syllabus.pdf" -> "syllabus.pdf" */
export function displayNameFromPath(path: string): string {
  const fileName = path.split('/').pop() ?? path;
  return fileName.replace(/^\d+_/, '');
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  async uploadMaterial(sectionId: string, file: File): Promise<string> {
    const path = `${sectionId}/${Date.now()}_${file.name}`;
    const { error } = await this.supabase.storage.from('materials').upload(path, file);
    if (error) {
      throw error;
    }
    return path;
  }

  async getMaterialUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('materials')
      .createSignedUrl(path, 3600);
    if (error) {
      throw error;
    }
    return data.signedUrl;
  }

  async uploadCourseCover(courseId: string, file: File): Promise<string> {
    const path = `${courseId}/${Date.now()}_${file.name}`;
    const { error } = await this.supabase.storage.from('course-covers').upload(path, file);
    if (error) {
      throw error;
    }
    return this.supabase.storage.from('course-covers').getPublicUrl(path).data.publicUrl;
  }
}
