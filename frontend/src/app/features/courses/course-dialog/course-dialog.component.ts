import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Course } from '../../../shared/models/lms.models';

export interface CourseFormData {
  code: string;
  title: string;
  coverGradient: string;
  coverFile: File | null;
}

const MAX_COVER_BYTES = 2 * 1024 * 1024; // 2 MB
const COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// the gradient choices shown as color swatches
const GRADIENTS: { name: string; value: string }[] = [
  { name: 'Purple', value: 'linear-gradient(135deg, #8a82c0, #5d4f9e)' },
  { name: 'Blue', value: 'linear-gradient(135deg, #b9c6d8, #959bb0)' },
  { name: 'Pink', value: 'linear-gradient(135deg, #e6bcc6, #b4849f)' },
  { name: 'Coral', value: 'linear-gradient(135deg, #f7a79f, #e8695c)' },
  { name: 'Mint', value: 'linear-gradient(135deg, #b8e0d2, #6fae9a)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #ffd3a5, #fd8f8f)' },
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
export class CourseDialogComponent {
  // null when adding a course, the course itself when editing
  protected readonly existing = inject<Course | null>(MAT_DIALOG_DATA, { optional: true });
  private readonly dialogRef =
    inject<MatDialogRef<CourseDialogComponent, CourseFormData>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);

  protected readonly gradients = GRADIENTS;
  protected readonly selectedGradient = signal(
    this.existing?.coverGradient ?? GRADIENTS[0].value,
  );

  private selectedFile: File | null = null;
  protected readonly fileName = signal<string | null>(null);
  protected readonly fileError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    code: [this.existing?.code ?? '', Validators.required],
    title: [this.existing?.title ?? '', Validators.required],
  });

  protected get heading(): string {
    return this.existing ? 'Edit course' : 'Add course';
  }

  protected get saveLabel(): string {
    return this.existing ? 'Save changes' : 'Add course';
  }

  protected pickGradient(value: string): void {
    this.selectedGradient.set(value);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) return;

    if (!COVER_TYPES.includes(file.type)) {
      this.fileError.set('Please choose a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      this.fileError.set('Choose an image smaller than 2 MB.');
      return;
    }

    this.fileError.set(null);
    this.selectedFile = file;
    this.fileName.set(file.name);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      code: value.code.trim(),
      title: value.title.trim(),
      coverGradient: this.selectedGradient(),
      coverFile: this.selectedFile,
    });
  }
}