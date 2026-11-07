import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Enrollments } from '../../../core/services/enrollments';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
const TEMP_STUDENT_ID = 'student-1';

@Component({
  selector: 'app-join-section-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './join-section-dialog.html',
})
export class JoinSectionDialog {
  private dialogRef = inject(MatDialogRef<JoinSectionDialog, string>);
  private enrollments = inject(Enrollments);

  code = signal('');
  saving = signal(false);
  error = signal('');

  onCodeInput(event: Event): void {
    this.code.set((event.target as HTMLInputElement).value);
  }

  join(): void {
    const code = this.code().trim();
    this.error.set('');
    if (!code) {
      this.error.set('Enter the join code from your teacher.');
      return;
    }
    this.saving.set(true);
    this.enrollments.joinSection(TEMP_STUDENT_ID, code).subscribe({
      next: (sectionId) => {
        this.saving.set(false);
        this.dialogRef.close(sectionId);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('That code did not match any section. Check it and try again.');
      },
    });
  }
}