import { Location } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, map, of, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Activities } from '../../../../core/services/activities';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

const MIN_SAVING_MS = 700;
const DEFAULT_TIME = '23:59';

@Component({
  selector: 'app-activity-create',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './activity-create.html',
  styleUrl: './activity-create.scss',
})
export class ActivityCreate {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private activitiesService = inject(Activities);

  readonly sectionIdInput = input<string>(undefined, { alias: 'sectionId' });
  readonly maxTitle = 120;

  saving = signal(false);
  error = signal('');
  message = signal('');
  invalid = signal(false);
  shake = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(this.maxTitle)]],
    instructions: [''],
    points: [100, [Validators.required, Validators.min(0)]],
    dueDate: [null as Date | null],
    dueTime: [''], // Optional time string
    formUrl: ['', [Validators.pattern(/^https?:\/\/\S+$/i)]],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.invalid()) {
        this.invalid.set(false);
        this.error.set('');
      }
      if (this.message()) this.message.set('');
    });

    // Automatically manage time state based on whether a due date is present
    this.form.get('dueDate')?.valueChanges.subscribe((dueDate) => {
      const timeCtrl = this.form.get('dueTime');
      if (!dueDate) {
        timeCtrl?.setValue('');
        timeCtrl?.disable({ emitEvent: false });
      } else {
        timeCtrl?.enable({ emitEvent: false });
        if (!timeCtrl?.value) {
          timeCtrl?.setValue(DEFAULT_TIME, { emitEvent: false });
        }
      }
    });

    // Initial state check
    if (!this.form.get('dueDate')?.value) {
      this.form.get('dueTime')?.disable({ emitEvent: false });
    }
  }

  private get sectionId(): string | null {
    return this.sectionIdInput() ?? this.route.snapshot.paramMap.get('sectionId');
  }

  back(): void {
    this.location.back();
  }

  clearDue(): void {
    this.form.patchValue({ dueDate: null, dueTime: '' });
  }

  clearTime(): void {
    this.form.patchValue({ dueTime: '' });
  }

  endShake(event: AnimationEvent): void {
    if (event.target === event.currentTarget) this.shake.set(false);
  }

  private dueAtIso(dueDate: Date | null, dueTime: string): string | null {
    if (!dueDate) return null;
    const timeToUse = dueTime || DEFAULT_TIME;
    const [h, m] = timeToUse.split(':').map(Number);
    const d = new Date(dueDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }

  post(): void {
    if (this.saving()) return;
    this.error.set('');
    this.message.set('');

    const sectionId = this.sectionId;
    if (!sectionId) {
      this.error.set('No section selected.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fix the highlighted fields.');
      this.invalid.set(true);
      this.shake.set(true);
      return;
    }

    const v = this.form.getRawValue();
    const due = this.dueAtIso(v.dueDate, v.dueTime);
    const pastDue = !!due && new Date(due) < new Date();

    this.dialog
      .open(ConfirmDialog, {
        width: '400px',
        data: {
          title: 'Post this activity?',
          message:
            `Students in this section will see "${v.title.trim()}".` +
            (pastDue ? ' Note: the due date is already in the past.' : ''),
          confirmText: 'Yes, post',
        },
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (ok) this.save(sectionId);
      });
  }

  private save(sectionId: string): void {
    const v = this.form.getRawValue();
    const formUrl = v.formUrl.trim();

    this.saving.set(true);
    this.form.disable();

    const request$ = this.activitiesService
      .create({
        section_id: sectionId,
        title: v.title.trim(),
        instructions: v.instructions.trim() || null,
        points: v.points,
        due_at: this.dueAtIso(v.dueDate, v.dueTime),
        form_url: formUrl || null,
      })
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      );

    forkJoin([request$, timer(MIN_SAVING_MS)]).subscribe(([ok]) => {
      this.saving.set(false);
      this.form.enable();
      if (!this.form.controls.dueDate.value) {
        this.form.controls.dueTime.disable({ emitEvent: false });
      }

      if (!ok) {
        this.error.set('Something went wrong. Please try again.');
        return;
      }

      this.form.reset({
        title: '',
        instructions: '',
        points: 100,
        dueDate: null,
        dueTime: '',
        formUrl: '',
      });
      this.form.get('dueTime')?.disable({ emitEvent: false });
      this.message.set('Activity posted! Students can see it now.');
    });
  }
}