import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  MOCK_ACTIVITIES,
  MOCK_GRADES,
  MOCK_STUDENTS,
  findSectionById,
} from '../../../shared/mock/lms-mock-data';
import { Activity, Grade, Student } from '../../../shared/models/lms.models';

interface SubmissionComment {
  id: string;
  text: string;
  postedAt: string;
}

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatButtonModule],
  templateUrl: './submissions.component.html',
  styleUrl: './submissions.component.scss',
})
export class SubmissionsComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly sectionId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
  protected readonly sectionCode = findSectionById(this.sectionId)?.sectionCode ?? 'XXXX-XXXX';

  protected readonly activity: Activity | undefined = MOCK_ACTIVITIES.find(
    (item) =>
      item.id === this.route.snapshot.paramMap.get('activityId') &&
      item.sectionId === this.sectionId,
  );

  private readonly students: Student[] = MOCK_STUDENTS.filter(
    (student) => student.sectionId === this.sectionId,
  );

  protected readonly ascending = signal(true);
  private readonly selectedId = signal<string | null>(null);
  private readonly commentsByStudent = signal<Record<string, SubmissionComment[]>>({});
  protected readonly commentDraft = new FormControl('', { nonNullable: true });

  protected readonly sortedStudents = computed(() => {
    const direction = this.ascending() ? 1 : -1;
    return [...this.students].sort(
      (a, b) =>
        direction *
        (a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
    );
  });

  protected readonly selected = computed<Student | undefined>(() => {
    const sorted = this.sortedStudents();
    return sorted.find((s) => s.id === this.selectedId()) ?? sorted[0];
  });

  protected readonly selectedComments = computed<SubmissionComment[]>(() => {
    const student = this.selected();
    return student ? (this.commentsByStudent()[student.id] ?? []) : [];
  });

  protected get submittedCount(): number {
    return this.students.filter((student) => this.gradeFor(student.id)?.status === 'Turned In')
      .length;
  }

  protected get pendingCount(): number {
    return this.students.length - this.submittedCount;
  }

  protected gradeFor(studentId: string): Grade | undefined {
    return MOCK_GRADES.find(
      (grade) => grade.studentId === studentId && grade.activityId === this.activity?.id,
    );
  }

  protected toggleSort(): void {
    this.ascending.update((value) => !value);
  }

  protected select(student: Student): void {
    this.selectedId.set(student.id);
    this.commentDraft.reset();
  }

  protected setScore(student: Student, event: Event): void {
    const grade = this.gradeFor(student.id);
    const activity = this.activity;
    if (!grade || !activity) {
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.value === '') {
      grade.score = null;
      return;
    }
    const parsed = Number(input.value);
    if (Number.isNaN(parsed)) {
      grade.score = null;
      input.value = '';
      return;
    }
    grade.score = Math.min(Math.max(parsed, 0), activity.points);
    input.value = String(grade.score);
  }

  protected addComment(): void {
    const student = this.selected();
    const text = this.commentDraft.value.trim();
    if (!student || !text) {
      return;
    }
    this.commentsByStudent.update((current) => ({
      ...current,
      [student.id]: [
        ...(current[student.id] ?? []),
        { id: `cmt-${Date.now()}`, text, postedAt: new Date().toISOString() },
      ],
    }));
    this.commentDraft.reset();
  }
}
