import { Injectable, computed, signal } from '@angular/core';

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
  // MOCK: starts logged out. Replace with real Supabase later.
  profile = signal<Profile | null>(null);
  role = computed(() => this.profile()?.role ?? null);
  userId = computed(() => this.profile()?.id ?? null);
  isLoggedIn = computed(() => !!this.profile());
  ready: Promise<void> = Promise.resolve();

  async signInWithGoogle() {
    this.mockLogin('student@iskolarngbayan.pup.edu.ph');
  }

  async signInWithEmail(email: string, _password: string) {
    this.mockLogin(email);
  }

  async signOut() {
    this.profile.set(null);
  }

  // Testing trick: an email containing "admin" or "teacher" gets that role
  private mockLogin(email: string) {
    const role: Role = email.includes('admin')
      ? 'admin'
      : email.includes('teacher')
        ? 'teacher'
        : 'student';
    this.profile.set({
      id: '1',
      email,
      full_name: email.split('@')[0],
      role,
      status: 'active',
    });
  }
}