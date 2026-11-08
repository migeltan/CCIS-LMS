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