import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { MOCK_STUDENTS, findSectionById, demoDataLoaded } from '../../../shared/mock/lms-mock-data';
import { Student } from '../../../shared/models/lms.models';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './people.component.html',
  styleUrl: './people.component.scss',
})
export class PeopleComponent {
  protected readonly demoLoaded = demoDataLoaded;

  private readonly sectionId = inject(ActivatedRoute).parent?.snapshot.paramMap.get('id') ?? '';
  protected readonly sectionCode = findSectionById(this.sectionId)?.sectionCode ?? 'XXXX-XXXX';

  // Signals for sorting logic
  protected readonly sortBy = signal<'lastName' | 'firstName'>('lastName');
  protected readonly ascending = signal(true);

  private readonly students: Student[] = MOCK_STUDENTS;

  protected readonly sortedStudents = computed(() => {
    const direction = this.ascending() ? 1 : -1;
    const key = this.sortBy();

    return [...this.students].sort((a, b) => {
      const valA = a[key].toLowerCase();
      const valB = b[key].toLowerCase();
      return direction * valA.localeCompare(valB);
    });
  });

  protected toggleSortOrder(): void {
    this.ascending.update((val) => !val);
  }

  protected toggleSortKey(): void {
    this.sortBy.update((key) => (key === 'lastName' ? 'firstName' : 'lastName'));
  }
}
