import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEFAULT_ROUTE } from '@frontend/constants';
import { DetailedUser, isRole, Role } from '@shared/api-interfaces';
import { isNotNone, isNull, ObjectValues } from '@shared/common';
import { combineLatest, filter, map } from 'rxjs';
import { AuthService } from '../auth.service';

export const AUTH_REDIRECT_URL_QUERY_PARAM = 'redirect-url';
export const ROUTE_AUTH_ROLES = 'authRoles';
export const ROUTE_EXPECTED_EMAIL_VERIFICATION_STATUS = 'expectedEmailVerificationStatus';

export const RouteExpectedEmailVerificationStatus = {
  Verified: 'verified',
  Unverified: 'unverified',
  Any: 'any',
} as const;
export type RouteExpectedEmailVerificationStatus = ObjectValues<typeof RouteExpectedEmailVerificationStatus>;

function isRoleArray(value: unknown): value is Array<Role> {
  return Array.isArray(value) && value.every(isRole);
}

function userHasAnyRole(user: DetailedUser, authRoles: Array<Role>): boolean {
  return authRoles.length === 0 || authRoles.some((role) => user.role === role);
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const routeAuthRoles = route.data[ROUTE_AUTH_ROLES] as unknown;

  let authRoles: Array<Role> = [];

  if (isNotNone(routeAuthRoles)) {
    if (!isRoleArray(routeAuthRoles)) {
      throw new Error('Invalid auth roles configuration for route. Expected an array of Role values.');
    }

    authRoles = routeAuthRoles;
  }

  const expectedEmailVerificationStatus =
    (route.data[ROUTE_EXPECTED_EMAIL_VERIFICATION_STATUS] as unknown) ?? RouteExpectedEmailVerificationStatus.Verified;

  return combineLatest([
    authService.authUser$,
    authService.isInitialized$.pipe(filter((isInitialized) => isInitialized)),
  ]).pipe(
    map(([user]) => {
      if (isNull(user) || !userHasAnyRole(user, authRoles)) {
        return router.createUrlTree(['/login'], {
          queryParams: {
            [AUTH_REDIRECT_URL_QUERY_PARAM]: state.url,
          },
        });
      }

      switch (expectedEmailVerificationStatus) {
        case RouteExpectedEmailVerificationStatus.Verified:
          if (!user.isEmailVerified) {
            return router.createUrlTree(['/verify-email']);
          }
          break;
        case RouteExpectedEmailVerificationStatus.Unverified:
          if (user.isEmailVerified) {
            return router.createUrlTree([DEFAULT_ROUTE]);
          }
          break;
        case RouteExpectedEmailVerificationStatus.Any:
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
          throw new Error(`Invalid expected email verification status: ${expectedEmailVerificationStatus}`);
      }

      return true;
    }),
  );
};
