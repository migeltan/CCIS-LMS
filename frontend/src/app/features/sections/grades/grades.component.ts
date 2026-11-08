import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  MOCK_ACTIVITIES,
  MOCK_GRADES,
  MOCK_STUDENTS,
  findSectionById,
  demoDataLoaded,
} from '../../../shared/mock/lms-mock-data';
import { Activity, Grade, Student } from '../../../shared/models/lms.models';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.scss',
})
export class GradesComponent {
  private readonly snackBar = inject(MatSnackBar);

  protected readonly demoLoaded = demoDataLoaded;

  private readonly sectionId = inject(ActivatedRoute).parent?.snapshot.paramMap.get('id') ?? '';
  protected readonly sectionCode = findSectionById(this.sectionId)?.sectionCode ?? 'XXXX-XXXX';

  protected readonly students: Student[] = MOCK_STUDENTS;
  protected readonly activities: Activity[] = MOCK_ACTIVITIES.filter((a) => a.kind === 'Activity');

  protected readonly displayedColumns: string[] = [
    'student',
    ...this.activities.map((activity) => activity.id),
    'overall',
  ];

  // true = score cells become inputs
  protected readonly editing = signal(false);

  // bumped when grades change so the table refreshes
  private readonly version = signal(0);

  protected toggleEditing(): void {
    this.editing.update((v) => !v);
  }

  protected gradeFor(studentId: string, activityId: string): Grade | undefined {
    this.version();
    return MOCK_GRADES.find(
      (grade) => grade.studentId === studentId && grade.activityId === activityId,
    );
  }

  protected overallFor(student: Student): number | null {
    this.version();
    let earned = 0;
    let possible = 0;
    for (const activity of this.activities) {
      const score = this.gradeFor(student.id, activity.id)?.score;
      if (score === null || score === undefined) continue;
      earned += score;
      possible += activity.points;
    }
    return possible === 0 ? null : Math.round((earned / possible) * 1000) / 10;
  }

  // Called when the teacher finishes typing a score
  protected onScoreChange(student: Student, activity: Activity, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();

    let score: number | null = null;
    if (raw !== '') {
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) {
        input.value = '';
      } else {
        // keep the score between 0 and the activity's points
        score = Math.min(Math.max(parsed, 0), activity.points);
        input.value = String(score);
      }
    }

    const existing = this.gradeFor(student.id, activity.id);
    if (existing) {
      existing.score = score;
    } else {
      MOCK_GRADES.push({
        studentId: student.id,
        activityId: activity.id,
        score,
        status: 'Pending',
        submissionFile: null,
      });
    }
    this.version.update((v) => v + 1);
  }

  // --- EXPORT TO CSV ---
  protected exportCsv(): void {
    const header = [
      'Last Name',
      'First Name',
      ...this.activities.map((a) => `${a.title} (${a.points} pts)`),
      'Overall %',
    ];

    const rows = this.students.map((student) => {
      const scores = this.activities.map((a) => {
        const score = this.gradeFor(student.id, a.id)?.score;
        return score === null || score === undefined ? '' : String(score);
      });
      const overall = this.overallFor(student);
      return [student.lastName, student.firstName, ...scores, overall === null ? '' : String(overall)];
    });

    const csv = [header, ...rows].map((row) => row.map((cell) => this.csvCell(cell)).join(',')).join('\r\n');

    // the BOM makes Excel read accents correctly
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grades-${this.sectionCode}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.snackBar.open('Grades exported.', 'Dismiss', { duration: 3000 });
  }

  private csvCell(value: string): string {
    // stops spreadsheet formula injection (cells starting with = + - @)
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }
}