import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MySection } from '../../core/models/classwork.models';
import { Enrollments } from '../../core/services/enrollments';
import { JoinSectionDialog } from './join-section-dialog/join-section-dialog';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  templateUrl: './dashboard.html',
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
}