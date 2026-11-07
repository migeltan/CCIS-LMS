import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, inject, input, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Activity, SubmissionWithFiles } from '../../../../core/models/classwork.models';
import { Activities } from '../../../../core/services/activities';
import { ActivityComment, Comments } from '../../../../core/services/comments';
import { Submissions } from '../../../../core/services/submissions';
import { launchConfetti } from '../confetti';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';
const TEMP_STUDENT_NAME = 'You';
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_COMMENT_LENGTH = 500;
// Keep loading states visible long enough for the user to notice them.
const MIN_SAVING_MS = 700;

const AFFIRMATIONS = [
  'Great job! Your work is in.',
  'Nice work! Submitted successfully.',
  'Well done! Your teacher can see your work now.',
  "You're all set. Keep it up!",
];

@Component({
  selector: 'app-activity-submit',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './activity-submit.html',
  styleUrl: './activity-submit.scss',
})
export class ActivitySubmit implements OnInit {
  private route = inject(ActivatedRoute);
  private activitiesService = inject(Activities);
  private submissionsService = inject(Submissions);
  private commentsService = inject(Comments);
  private dialog = inject(MatDialog);

  private picker = viewChild<ElementRef<HTMLInputElement>>('picker');

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

  // "Your work" card turns red and shakes when nothing is attached.
  workInvalid = signal(false);
  shakeWork = signal(false);

  // Private comments to the teacher.
  comments = signal<ActivityComment[]>([]);
  commentOpen = signal(false);
  commentText = signal('');
  sendingComment = signal(false);
  commentError = signal('');
  readonly maxComment = MAX_COMMENT_LENGTH;

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
    this.commentsService.listForStudent(id, this.studentId).subscribe((list) => {
      this.comments.set(list);
    });
  }

  private loadMine(activityId: string): void {
    this.submissionsService.getMine(activityId, this.studentId).subscribe((s) => {
      this.mySubmission.set(s);
      if (s?.answer_text) this.linkUrl.set(s.answer_text);
    });
  }

  /** What the student sees. A graded-but-unreleased work still shows as "Submitted". */
  statusLabel(sub: SubmissionWithFiles): string {
    if (sub.status === 'graded' && sub.grade_released) return 'Graded';
    if (sub.status === 'draft') return 'Draft';
    return 'Submitted';
  }

  /** True only when the teacher has released a score, so the points tag can show it. */
  scoreVisible(): boolean {
    const s = this.mySubmission();
    return !!s && s.grade_released && s.score !== null;
  }

  isOverdue(): boolean {
    const due = this.activity()?.due_at;
    return !!due && new Date(due) < new Date() && !this.mySubmission();
  }

  // ---------- Your work ----------
  onLinkInput(event: Event): void {
    this.linkUrl.set((event.target as HTMLInputElement).value);
    this.error.set('');
    this.message.set('');
    this.workInvalid.set(false);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0] ?? null;
    this.error.set('');
    this.message.set('');
    this.workInvalid.set(false);

    if (picked && !ALLOWED_TYPES.includes(picked.type)) {
      input.value = '';
      this.file.set(null);
      this.error.set('Only PDF, PPTX, DOCX, PNG or JPG files are allowed.');
      return;
    }
    if (picked && picked.size > MAX_FILE_BYTES) {
      input.value = '';
      this.file.set(null);
      this.error.set('The file must be 10 MB or smaller.');
      return;
    }
    this.file.set(picked);
  }

  clearFile(): void {
    this.file.set(null);
    this.resetPicker();
  }

  private resetPicker(): void {
    const el = this.picker()?.nativeElement;
    if (el) el.value = '';
  }

  /** Called when any child animation ends; only react to the card's own shake. */
  endShake(event: AnimationEvent): void {
    if (event.target === event.currentTarget) this.shakeWork.set(false);
  }

  /** Submit button handler: validates first, then asks "Are you sure?". */
  askToSubmit(): void {
    if (this.saving()) return;

    const link = this.linkUrl().trim();

    // Empty work: go straight to submit() so the red shake still happens.
    if (!link && !this.file()) {
      this.submit();
      return;
    }

    // Bad link: show the error before asking anything.
    if (link && !/^https?:\/\//i.test(link)) {
      this.submit();
      return;
    }

    const again = !!this.mySubmission();
    this.dialog
      .open(ConfirmDialog, {
        width: '380px',
        data: {
          title: again ? 'Resubmit your work?' : 'Submit your work?',
          message: again
            ? 'This replaces your previous submission.'
            : 'Your teacher will see it. You can still resubmit later.',
          confirmText: again ? 'Yes, resubmit' : 'Yes, submit',
        },
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (ok) this.submit();
      });
  }

  submit(): void {
    if (this.saving()) return;

    const activity = this.activity();
    if (!activity) return;

    const link = this.linkUrl().trim();
    const file = this.file();
    this.error.set('');
    this.message.set('');

    if (!link && !file) {
      this.error.set('Add a link or choose a file before submitting.');
      this.workInvalid.set(true);
      this.shakeWork.set(true);
      return;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      this.error.set('The link must start with http:// or https://');
      return;
    }

    this.saving.set(true);

    const request$ = this.submissionsService
      .submit({
        activityId: activity.id,
        sectionId: activity.section_id,
        studentId: this.studentId,
        answerText: link || null,
        file,
      })
      .pipe(
        map((s) => ({ s })),
        catchError(() => of({ s: null })),
      );

    // Wait for BOTH the request and the minimum loading time.
    forkJoin([request$, timer(MIN_SAVING_MS)]).subscribe(([result]) => {
      this.saving.set(false);

      if (!result.s) {
        this.error.set('Something went wrong. Please try again.');
        return;
      }

      this.mySubmission.set(result.s);
      this.file.set(null);
      this.resetPicker();
      this.workInvalid.set(false);
      this.message.set(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
      launchConfetti();
    });
  }

  // ---------- Private comments ----------
  isMine(c: ActivityComment): boolean {
    return c.author_id === this.studentId;
  }

  openComment(): void {
    this.commentOpen.set(true);
  }

  cancelComment(): void {
    this.commentOpen.set(false);
    this.commentText.set('');
    this.commentError.set('');
  }

  onCommentInput(event: Event): void {
    this.commentText.set((event.target as HTMLTextAreaElement).value);
    this.commentError.set('');
  }

  sendComment(): void {
    const activity = this.activity();
    const body = this.commentText().trim();
    if (!activity || this.sendingComment()) return;

    if (!body) {
      this.commentError.set('Write a message first.');
      return;
    }
    if (body.length > MAX_COMMENT_LENGTH) {
      this.commentError.set(`Keep it under ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    this.sendingComment.set(true);
    this.commentsService
      .add({
        activityId: activity.id,
        studentId: this.studentId,
        authorId: this.studentId,
        authorName: TEMP_STUDENT_NAME,
        body,
      })
      .subscribe({
        next: (c) => {
          this.comments.update((list) => [...list, c]);
          this.sendingComment.set(false);
          this.cancelComment();
        },
        error: () => {
          this.sendingComment.set(false);
          this.commentError.set('Could not send your comment. Please try again.');
        },
      });
  }
}