import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface CourseFormData {
  code: string;
  title: string;
  coverGradient: string;
  coverFile: File | null;
}

const MAX_COVER_BYTES = 5 * 1024 * 1024;

const COVER_GRADIENTS: readonly string[] = [
  'linear-gradient(180deg, #d4727a, #a94f87)',
  'linear-gradient(180deg, #e4a1a1, #8e5a72)',
  'linear-gradient(180deg, #c58fc4, #6f5a9c)',
  'linear-gradient(180deg, #e8b933, #8a5a10)',
  'linear-gradient(180deg, #dde04a, #4f9b1a)',
  'linear-gradient(180deg, #6f93c4, #3a4468)',
];

@Component({
  selector: 'app-course-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './course-dialog.component.html',
  styleUrl: './course-dialog.component.scss',
})
export class CourseDialogComponent implements OnDestroy {
  private readonly dialogRef =
    inject<MatDialogRef<CourseDialogComponent, CourseFormData>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);
  private coverFile: File | null = null;

  protected readonly gradients = COVER_GRADIENTS;
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    title: ['', Validators.required],
    coverGradient: [COVER_GRADIENTS[0]],
  });

  protected get previewBackground(): string {
    const url = this.previewUrl();
    return url ? `center / cover no-repeat url("${url}")` : this.form.controls.coverGradient.value;
  }

  ngOnDestroy(): void {
    this.clearPhoto();
  }

  protected selectGradient(gradient: string): void {
    this.clearPhoto();
    this.uploadError.set(null);
    this.form.controls.coverGradient.setValue(gradient);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Choose an image file (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      this.uploadError.set('Choose an image smaller than 5 MB.');
      return;
    }
    this.uploadError.set(null);
    this.clearPhoto();
    this.coverFile = file;
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({
      ...this.form.getRawValue(),
      coverFile: this.coverFile,
    });
  }

  private clearPhoto(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.previewUrl.set(null);
    this.coverFile = null;
  }
}
