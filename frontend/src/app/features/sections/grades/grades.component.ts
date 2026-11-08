import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table'; // <--- THIS IS THE FIX
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
  // 👇 BOTH OF THESE MUST BE IN THE IMPORTS ARRAY
  imports: [CommonModule, MatTableModule],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.scss',
})
export class GradesComponent {
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

  protected gradeFor(studentId: string, activityId: string): Grade | undefined {
    return MOCK_GRADES.find(
      (grade) => grade.studentId === studentId && grade.activityId === activityId,
    );
  }

  protected overallFor(student: Student): number | null {
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
}
