import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { MySection } from '../../../core/models/classwork.models';
import { Enrollments } from '../../../core/services/enrollments';
import { ActivityList } from '../../classwork/activities/activity-list/activity-list';
import { Skeleton } from '../../skeleton/skeleton';
import { sectionDesign } from '../section-design';

@Component({
  selector: 'app-class-view',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ActivityList,
    Skeleton,
  ],
  templateUrl: './class-view.html',
  styleUrl: './class-view.scss',
})
export class ClassView implements OnInit {
  private route = inject(ActivatedRoute);
  private enrollments = inject(Enrollments);
  private auth = inject(AuthService);

  section = signal<MySection | undefined>(undefined);
  loading = signal(true);

  design = sectionDesign;

  ngOnInit(): void {
    // Re-run whenever the class id in the address changes (e.g. sidebar links).
    this.route.paramMap.subscribe((params) => {
      const id = params.get('sectionId');
      this.loading.set(true);
      this.enrollments.listMySections(this.auth.userId() ?? '').subscribe((list) => {
        // Only sections the student has joined can be opened.
        this.section.set(list.find((s) => s.id === id));
        this.loading.set(false);
      });
    });
  }
}