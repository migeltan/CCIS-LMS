import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

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
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/shell/shell').then(m => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-placeholder/dashboard-placeholder')
            .then(m => m.DashboardPlaceholder),
      },
      {
        path: 'courses',
        canActivate: [roleGuard('teacher', 'admin')],
        loadComponent: () =>
          import('./features/courses/courses-placeholder/courses-placeholder')
            .then(m => m.CoursesPlaceholder),
      },
      {
        path: 'admin',
        canActivate: [roleGuard('admin')],
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users').then(m => m.AdminUsers),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
