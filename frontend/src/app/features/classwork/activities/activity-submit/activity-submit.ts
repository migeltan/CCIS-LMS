import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Activity, SubmissionWithFiles } from '../../../../core/models/classwork.models';
import { Activities } from '../../../../core/services/activities';
import { Submissions } from '../../../../core/services/submissions';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';

@Component({
  selector: 'app-activity-submit',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  templateUrl: './activity-submit.html',
})
export class ActivitySubmit implements OnInit {
  private route = inject(ActivatedRoute);
  private activitiesService = inject(Activities);
  private submissionsService = inject(Submissions);

  // Works both as a routed page (:activityId) and as an embedded component in a tab.
  readonly activityIdInput = input<string>(undefined, { alias: 'activityId' });

  activity = signal<Activity | undefined>(undefined);
  mySubmission = signal<SubmissionWithFiles | undefined>(undefined);
  linkUrl = signal('');
  file = signal<File | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  message = signal('');

  private get studentId(): string {
    return TEMP_STUDENT_ID;
  }

  ngOnInit(): void {
    const id = this.activityIdInput() ?? this.route.snapshot.paramMap.get('activityId');
    if (!id) {
      this.loading.set(false);
      this.error.set('No activity selected.');
      return;
    }
    this.activitiesService.getById(id).subscribe((a) => {
      this.activity.set(a);
      this.loading.set(false);
    });
    this.loadMine(id);
  }

  private loadMine(activityId: string): void {
    this.submissionsService.getMine(activityId, this.studentId).subscribe((s) => {
      this.mySubmission.set(s);
      if (s?.answer_text) this.linkUrl.set(s.answer_text);
    });
  }

  onLinkInput(event: Event): void {
    this.linkUrl.set((event.target as HTMLInputElement).value);
  }

  onFileChange(event: Event): void {
    const picked = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(picked);
  }

  submit(): void {
    const activity = this.activity();
    if (!activity) return;

    const link = this.linkUrl().trim();
    const file = this.file();
    this.error.set('');
    this.message.set('');

    if (!link && !file) {
      this.error.set('Add a link or choose a file before submitting.');
      return;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      this.error.set('The link must start with http:// or https://');
      return;
    }

    this.saving.set(true);
    this.submissionsService
      .submit({
        activityId: activity.id,
        sectionId: activity.section_id,
        studentId: this.studentId,
        answerText: link || null,
        file,
      })
      .subscribe({
        next: (s) => {
          this.mySubmission.set(s);
          this.file.set(null);
          this.saving.set(false);
          this.message.set('Submitted!');
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Something went wrong. Please try again.');
        },
      });
  }
}