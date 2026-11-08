import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/courses/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'section/:id',
    loadComponent: () =>
      import('./features/sections/section-layout/section-layout.component').then(
        (m) => m.SectionLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'stream' },
      {
        path: 'stream',
        loadComponent: () =>
          import('./features/stream/stream/stream.component').then((m) => m.StreamComponent),
      },
      {
        path: 'classwork',
        loadComponent: () =>
          import('./features/sections/classwork/classwork.component').then(
            (m) => m.ClassworkComponent,
          ),
      },
      {
        path: 'submissions/:activityId',
        loadComponent: () =>
          import('./features/sections/submissions/submissions.component').then(
            (m) => m.SubmissionsComponent,
          ),
      },
      {
        path: 'grades',
        loadComponent: () =>
          import('./features/sections/grades/grades.component').then((m) => m.GradesComponent),
      },
      {
        path: 'people',
        loadComponent: () =>
          import('./features/sections/people/people.component').then((m) => m.PeopleComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
