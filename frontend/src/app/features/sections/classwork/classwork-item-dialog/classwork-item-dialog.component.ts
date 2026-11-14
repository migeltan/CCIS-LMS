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
  initialTitle?: string; // set when renaming a topic
}

export interface ClassworkDialogResult {
  title: string;
  details: string;
  dueAt: string | null;
  points: number;
  file: File | null;
  linkUrl: string | null;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
  'png', 'jpg', 'jpeg', 'zip',
];

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

  protected readonly acceptAttr = ALLOWED_EXTENSIONS.map((e) => '.' + e).join(',');

  protected readonly fileName = signal<string | null>(
    this.data.item?.attachmentPath ? displayNameFromPath(this.data.item.attachmentPath) : null,
  );
  protected readonly fileError = signal<string | null>(null);
  protected readonly linkError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: [this.data.item?.title ?? this.data.initialTitle ?? '', Validators.required],
    details: [this.data.item?.details ?? ''],
    dueAt: [this.data.item?.dueAt ?? ''],
    points: [this.data.item?.points ?? 100, Validators.min(0)],
    linkUrl: [this.data.item?.linkUrl ?? ''],
  });

  protected get heading(): string {
    const editing = !!this.data.item || this.data.initialTitle !== undefined;
    return `${editing ? 'Edit' : 'Add'} ${this.data.kind.toLowerCase()}`;
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      this.fileError.set('Allowed files: PDF, Word, PowerPoint, Excel, TXT, PNG, JPG, ZIP.');
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

  // Returns a clean https URL, '' if empty, or null if invalid
  private normalizeLink(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed === '') return '';
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(withProtocol);
      return url.hostname.includes('.') ? url.toString() : null;
    } catch {
      return null;
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    let linkUrl: string | null = null;
    if (this.data.kind !== 'Topic') {
      const link = this.normalizeLink(value.linkUrl);
      if (link === null) {
        this.linkError.set('Enter a valid link, e.g. https://example.com');
        return;
      }
      this.linkError.set(null);
      linkUrl = link === '' ? null : link;
    }

    this.dialogRef.close({
      title: value.title.trim(),
      details: value.details.trim(),
      dueAt: value.dueAt === '' ? null : value.dueAt,
      points: value.points,
      file: this.selectedFile,
      linkUrl,
    });
  }
}