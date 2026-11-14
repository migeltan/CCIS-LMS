import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { MySection } from '../../core/models/classwork.models';
import { Enrollments } from '../../core/services/enrollments';
import { Skeleton } from '../skeleton/skeleton';
import { JoinSectionDialog } from './join-section-dialog/join-section-dialog';
import { sectionDesign } from './section-design';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatIconModule, Skeleton],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private dialog = inject(MatDialog);
  private enrollments = inject(Enrollments);
  private auth = inject(AuthService);

  sections = signal<MySection[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.enrollments.listMySections(this.auth.userId() ?? '').subscribe((list) => {
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

  /** Banner colors and pattern for a section (shared with the class page). */
  design(id: string): { c1: string; c2: string; pattern: number } {
    return sectionDesign(id);
  }

  /** "INTE 301" -> "IN" */
  initials(code: string): string {
    return code.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?';
  }
}