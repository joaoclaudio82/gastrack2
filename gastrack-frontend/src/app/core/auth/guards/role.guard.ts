import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@models/role.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Support both string[] and UserRole[] for backward compatibility
  const requiredRoles = route.data['roles'] as (string | UserRole)[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // UserRole enum values are already strings, so we can use them directly
  const rolesAsStrings = requiredRoles;

  if (authService.hasAnyRole(rolesAsStrings)) {
    return true;
  }

  // Rotas que sabem explicar o próprio bloqueio passam `forbiddenReason`; sem isso a
  // página 403 cai no texto genérico.
  void router.navigate(['/errors/forbidden'], {
    state: { forbiddenReason: route.data['forbiddenReason'] as string | undefined },
  });
  return false;
};
