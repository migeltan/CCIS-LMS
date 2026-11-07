import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MySection } from '../../core/models/classwork.models';
import { Enrollments } from '../../core/services/enrollments';
import { JoinSectionDialog } from './join-section-dialog/join-section-dialog';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private dialog = inject(MatDialog);
  private enrollments = inject(Enrollments);

  sections = signal<MySection[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.enrollments.listMySections(TEMP_STUDENT_ID).subscribe((list) => {
      this.sections.set(list);
      this.loading.set(false);
    });
  }

  openJoinDialog(): void {
    this.dialog
      .open(JoinSectionDialog, { width: '400px' })
      .afterClosed()
      .subscribe((sectionId?: string) => {
        if (sectionId) this.load();
      });
  }

   private readonly palette: [string, string][] = [
    ['#1a73e8', '#0b57d0'], // blue
    ['#0f9d8a', '#0a6f64'], // teal
    ['#188038', '#0d652d'], // green
    ['#8e24aa', '#6a1b9a'], // purple
    ['#d81b60', '#ad1457'], // pink
    ['#c4570a', '#9a4300'], // orange
    ['#3949ab', '#283593'], // indigo
    ['#00838f', '#006064'], // cyan
    ['#c62828', '#8e0000'], // red
    ['#5d4037', '#3e2723'], // brown
    ['#455a64', '#263238'], // slate
  ];

  /** Stable "random" banner look: the same section always gets the same one. */
  design(id: string): { c1: string; c2: string; pattern: number } {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [c1, c2] = this.palette[h % this.palette.length];
    return { c1, c2, pattern: h % 5 };
  }
    /** "INTE 301" -> "IN" */
  initials(code: string): string {
    return code.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?';
  }
}