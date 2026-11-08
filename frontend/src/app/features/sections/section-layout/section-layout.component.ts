import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { findSectionById } from '../../../shared/mock/lms-mock-data';
import { Section } from '../../../shared/models/lms.models';

@Component({
  selector: 'app-section-layout',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './section-layout.component.html',
  styleUrl: './section-layout.component.scss',
})
export class SectionLayoutComponent {
  private readonly route = inject(ActivatedRoute);

  // We can hardcode the teacher's name for now
  protected readonly teacherFullName = 'Maria Santos';

  // Get the section ID from the URL
  protected readonly sectionId = this.route.snapshot.paramMap.get('id') ?? '';

  // Look up the section data from our mock data
  protected readonly section: Section | undefined = findSectionById(this.sectionId);

  // The navigation links for the sidebar
  protected readonly navItems = [
    { label: 'Stream', path: 'stream', icon: 'assets/images/icon-stream.svg' },
    { label: 'Classwork', path: 'classwork', icon: 'assets/images/icon-classwork.svg' },
    { label: 'Grades', path: 'grades', icon: 'assets/images/icon-grades.svg' },
    { label: 'People', path: 'people', icon: 'assets/images/icon-people.svg' },
  ];
}
