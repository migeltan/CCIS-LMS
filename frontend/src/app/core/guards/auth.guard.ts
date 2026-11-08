import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '../auth/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};

export const roleGuard = (...allowed: Role[]): CanActivateFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (!auth.isLoggedIn()) return router.parseUrl('/login');
  const role = auth.role();
  return role && allowed.includes(role)
    ? true
    : router.parseUrl('/dashboard');
};