import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/shell/shell').then(m => m.Shell),
    children: [
      // ---- Student side (Gwen) ----
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'class/:sectionId',
        loadComponent: () =>
          import('./features/dashboard/class-view/class-view').then(m => m.ClassView),
      },
      {
        path: 'activity-submit/:activityId',
        loadComponent: () =>
          import('./features/classwork/activities/activity-submit/activity-submit')
            .then(m => m.ActivitySubmit),
      },
      {
        path: 'my-grades',
        loadComponent: () => import('./features/grades/my-grades/my-grades').then(m => m.MyGrades),
      },
      {
        path: 'activity-create/:sectionId',
        canActivate: [roleGuard('teacher', 'admin')],
        loadComponent: () =>
          import('./features/classwork/activities/activity-create/activity-create')
            .then(m => m.ActivityCreate),
      },
      {
        path: 'gradebook/:activityId',
        canActivate: [roleGuard('teacher', 'admin')],
        loadComponent: () =>
          import('./features/grades/gradebook/gradebook').then(m => m.Gradebook),
      },

      // ---- Teacher side and admin (Nicole, Jaycee) ----
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