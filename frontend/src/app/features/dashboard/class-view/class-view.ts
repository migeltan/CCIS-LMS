import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MySection } from '../../../core/models/classwork.models';
import { Enrollments } from '../../../core/services/enrollments';
import { ActivityList } from '../../classwork/activities/activity-list/activity-list';
import { sectionDesign } from '../section-design';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';

@Component({
  selector: 'app-class-view',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ActivityList],
  templateUrl: './class-view.html',
  styleUrl: './class-view.scss',
})
export class ClassView implements OnInit {
  private route = inject(ActivatedRoute);
  private enrollments = inject(Enrollments);

  section = signal<MySection | undefined>(undefined);
  loading = signal(true);

  design = sectionDesign;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sectionId');
    this.enrollments.listMySections(TEMP_STUDENT_ID).subscribe((list) => {
      // Only sections the student has joined can be opened.
      this.section.set(list.find((s) => s.id === id));
      this.loading.set(false);
    });
  }
}