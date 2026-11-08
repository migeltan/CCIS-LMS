import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Activity, ClassworkKind } from '../../../../shared/models/lms.models';
import { displayNameFromPath } from '../../../../shared/storage/storage.service';

export type ClassworkDialogKind = 'Topic' | ClassworkKind;

export interface ClassworkDialogData {
  kind: ClassworkDialogKind;
  item?: Activity;
}

export interface ClassworkDialogResult {
  title: string;
  details: string;
  dueAt: string | null;
  points: number;
  file: File | null;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024;

@Component({
  selector: 'app-classwork-item-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './classwork-item-dialog.component.html',
  styleUrl: './classwork-item-dialog.component.scss',
})
export class ClassworkItemDialogComponent {
  protected readonly data = inject<ClassworkDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<ClassworkItemDialogComponent, ClassworkDialogResult>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);
  private selectedFile: File | null = null;

  protected readonly fileName = signal<string | null>(
    this.data.item?.attachmentPath ? displayNameFromPath(this.data.item.attachmentPath) : null,
  );
  protected readonly fileError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: [this.data.item?.title ?? '', Validators.required],
    details: [this.data.item?.details ?? ''],
    dueAt: [this.data.item?.dueAt ?? ''],
    points: [this.data.item?.points ?? 100, Validators.min(0)],
  });

  protected get heading(): string {
    const action = this.data.item ? 'Edit' : 'Add';
    return `${action} ${this.data.kind.toLowerCase()}`;
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.fileError.set('Choose a file smaller than 50 MB.');
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
      title: value.title.trim(),
      details: value.details.trim(),
      dueAt: value.dueAt === '' ? null : value.dueAt,
      points: value.points,
      file: this.selectedFile,
    });
  }
}
