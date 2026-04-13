import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEFAULT_ROUTE } from '@frontend/constants';
import { isNull } from '@shared/common';
import { combineLatest, filter, map } from 'rxjs';
import { AuthService } from '../auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return combineLatest([
    authService.authUser$,
    authService.isInitialized$.pipe(filter((isInitialized) => isInitialized)),
  ]).pipe(
    map(([user]) => {
      if (isNull(user)) {
        return true;
      }

      return router.createUrlTree([DEFAULT_ROUTE]);
    }),
  );
};
