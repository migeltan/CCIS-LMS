import { Injectable, computed, signal } from '@angular/core';
import { supabase } from '../supabase';

export type Role = 'student' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  profile = signal<Profile | null>(null);
  role = computed(() => this.profile()?.role ?? null);
  userId = computed(() => this.profile()?.id ?? null);
  isLoggedIn = computed(() => !!this.profile());
  ready: Promise<void> = this.loadProfile(); // keeps you signed in after a refresh

  async signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.loadProfile();
  }

  async signOut() {
    await supabase.auth.signOut();
    this.profile.set(null);
  }

  private async loadProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      this.profile.set(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    this.profile.set((data as Profile) ?? null);
  }
}