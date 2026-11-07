import { Component, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Activities } from '../../../../core/services/activities';

@Component({
  selector: 'app-activity-create',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './activity-create.html',
})
export class ActivityCreate {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private activitiesService = inject(Activities);

  // Works as a routed page (:sectionId) or embedded in a section tab.
  readonly sectionIdInput = input<string>(undefined, { alias: 'sectionId' });

  saving = signal(false);
  error = signal('');
  message = signal('');

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    instructions: [''],
    points: [100, [Validators.required, Validators.min(0)]],
    dueAt: [''], // datetime-local string, empty = no due date
    formUrl: [''],
  });

  private get sectionId(): string | null {
    return this.sectionIdInput() ?? this.route.snapshot.paramMap.get('sectionId');
  }

  post(): void {
    this.error.set('');
    this.message.set('');

    const sectionId = this.sectionId;
    if (!sectionId) {
      this.error.set('No section selected.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const formUrl = v.formUrl.trim();
    if (formUrl && !/^https?:\/\//i.test(formUrl)) {
      this.error.set('The Google Form link must start with http:// or https://');
      return;
    }

    this.saving.set(true);
    this.activitiesService
      .create({
        section_id: sectionId,
        title: v.title.trim(),
        instructions: v.instructions.trim() || null,
        points: v.points,
        due_at: v.dueAt ? new Date(v.dueAt).toISOString() : null,
        form_url: formUrl || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('Activity posted!');
          this.form.reset({ title: '', instructions: '', points: 100, dueAt: '', formUrl: '' });
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Something went wrong. Please try again.');
        },
      });
  }
}