import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { catchError, forkJoin, map, of, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Enrollments } from '../../../core/services/enrollments';
import { JoinErrorDialog } from './join-error-dialog';
import { AuthService } from '../../../core/auth/auth.service';

// TEMPORARY: replace with auth.userId() once the Shell PR is merged.
//const TEMP_STUDENT_ID = 'student-1';

// Keep the loading state visible long enough for the user to notice it.
const MIN_LOADING_MS = 700;

@Component({
  selector: 'app-join-section-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './join-section-dialog.html',
  styleUrl: './join-section-dialog.scss',
})
export class JoinSectionDialog {
  private dialogRef = inject(MatDialogRef<JoinSectionDialog, string>);
  private dialog = inject(MatDialog);
  private enrollments = inject(Enrollments);
  private auth = inject(AuthService);

  private codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');

  code = signal('');
  saving = signal(false);
  error = signal('');
  shake = signal(false);

  onCodeInput(event: Event): void {
    this.code.set((event.target as HTMLInputElement).value);
    // Clear the red state as soon as the user starts fixing the code.
    if (this.error()) this.error.set('');
  }

  join(): void {
    if (this.saving()) return;

    const code = this.code().trim();
    this.error.set('');

    if (!code) {
      this.showError('Enter the join code from your teacher.');
      return;
    }

    this.setSaving(true);

    const request$ = this.enrollments.joinSection(this.auth.userId() ?? '', code).pipe(
      map((sectionId) => ({ sectionId })),
      catchError(() => of({ sectionId: null })),
    );

    // Wait for BOTH the request and the minimum loading time.
    forkJoin([request$, timer(MIN_LOADING_MS)]).subscribe(([result]) => {
      this.setSaving(false);

      if (result.sectionId) {
        this.dialogRef.close(result.sectionId);
        return;
      }

      this.showError('That code did not match any section. Check it and try again.');
      this.dialog
        .open(JoinErrorDialog, { width: '360px' })
        .afterClosed()
        .subscribe(() => this.focusCode());
    });
  }

  private setSaving(value: boolean): void {
    this.saving.set(value);
    // Stop the user from closing the dialog (backdrop or Esc) while joining.
    this.dialogRef.disableClose = value;
  }

  private showError(message: string): void {
    this.error.set(message);
    this.shake.set(true);
  }

  private focusCode(): void {
    const el = this.codeInput()?.nativeElement;
    el?.focus();
    el?.select();
  }
}