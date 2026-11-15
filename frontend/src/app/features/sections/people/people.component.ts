import { Component, computed, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MOCK_STUDENTS, findSectionById, demoDataLoaded } from '../../../shared/mock/lms-mock-data';
import { Student } from '../../../shared/models/lms.models';

const AVATAR_COLORS = ['#ffd9d5', '#f7d6e8', '#e3d9f5', '#ffe8c9', '#d8efe6'];

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [],
  templateUrl: './people.component.html',
  styleUrl: './people.component.scss',
})
export class PeopleComponent {
  protected readonly demoLoaded = demoDataLoaded;

  private readonly sectionId = inject(ActivatedRoute).parent?.snapshot.paramMap.get('id') ?? '';
  protected readonly sectionCode = findSectionById(this.sectionId)?.sectionCode ?? 'XXXX-XXXX';

  protected readonly sortBy = signal<'lastName' | 'firstName'>('lastName');
  protected readonly ascending = signal(true);

  private readonly students: Student[] = MOCK_STUDENTS;

  protected readonly sortedStudents = computed(() => {
    const direction = this.ascending() ? 1 : -1;
    const key = this.sortBy();

    return [...this.students].sort((a, b) => {
      return direction * a[key].toLowerCase().localeCompare(b[key].toLowerCase());
    });
  });

  protected toggleSortOrder(): void {
    this.ascending.update((val) => !val);
  }

  protected toggleSortKey(): void {
    this.sortBy.update((key) => (key === 'lastName' ? 'firstName' : 'lastName'));
  }

  protected initials(student: Student): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  }

  protected avatarColor(index: number): string {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }
}